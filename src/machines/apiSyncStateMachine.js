import { createMachine, assign, fromPromise } from 'xstate';

export const apiSyncStateMachine = createMachine({
  id: 'apiSync',
  initial: 'idle',
  context: {
    targets: { ynab: false, settleup: false }, // Which APIs to call
    results: { ynab: null, settleup: null },   // API results
    errors: { ynab: null, settleup: null },    // API errors
  },
  states: {
    idle: {
      on: {
        START_SYNC: {
          target: 'syncing',
          actions: assign({
            targets: ({ event }) => event.targets,
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
      },
    },

    syncing: {
      type: 'parallel',
      states: {
        ynab: {
          initial: 'checking',
          states: {
            checking: {
              always: [
                { 
                  target: 'submitting', 
                  guard: { 
                    type: 'ynabTargeted',
                    params: ({ context }) => ({ targets: context.targets })
                  }
                },
                { target: 'skipped' },
              ],
            },
            skipped: {
              type: 'final',
            },
            submitting: {
              invoke: {
                id: 'submitYnabActor',
                src: 'submitYnab',
                onDone: {
                  target: 'success',
                  actions: assign({
                    results: ({ context, event }) => ({
                      ...context.results,
                      ynab: event.output,
                    }),
                  }),
                },
                onError: {
                  target: 'error',
                  actions: assign({
                    errors: ({ context, event }) => ({
                      ...context.errors,
                      ynab: event.error,
                    }),
                  }),
                },
              },
            },
            success: {
              type: 'final',
            },
            error: {
              type: 'final',
            },
          },
        },

        settleup: {
          initial: 'checking',
          states: {
            checking: {
              always: [
                { 
                  target: 'submitting', 
                  guard: { 
                    type: 'settleupTargeted',
                    params: ({ context }) => ({ targets: context.targets })
                  }
                },
                { target: 'skipped' },
              ],
            },
            skipped: {
              type: 'final',
            },
            submitting: {
              invoke: {
                id: 'submitSettleupActor',
                src: 'submitSettleup',
                onDone: {
                  target: 'success',
                  actions: assign({
                    results: ({ context, event }) => ({
                      ...context.results,
                      settleup: event.output,
                    }),
                  }),
                },
                onError: {
                  target: 'error',
                  actions: assign({
                    errors: ({ context, event }) => ({
                      ...context.errors,
                      settleup: event.error,
                    }),
                  }),
                },
              },
            },
            success: {
              type: 'final',
            },
            error: {
              type: 'final',
            },
          },
        },
      },
      onDone: [
        {
          target: 'success',
          guard: { 
            type: 'allTargetsSucceeded',
            params: ({ context }) => ({ context })
          }
        },
        {
          target: 'partialSuccess',
          guard: { 
            type: 'partialTargetsSucceeded',
            params: ({ context }) => ({ context })
          }
        },
        { target: 'error' },
      ],
    },

    success: {
      on: {
        RESET: { target: 'idle' },
      },
    },

    partialSuccess: {
      on: {
        RETRY_FAILED: {
          target: 'syncing',
          actions: assign({
            targets: ({ context }) => ({
              ynab: context.targets.ynab && !!context.errors.ynab,
              settleup: context.targets.settleup && !!context.errors.settleup,
            }),
          }),
        },
        RESET: { target: 'idle' },
      },
    },

    error: {
      on: {
        RETRY: { target: 'syncing' },
        RESET: { target: 'idle' },
      },
    },
  },
}, {
  guards: {
    ynabTargeted: ({ context }) => context.targets.ynab,
    settleupTargeted: ({ context }) => context.targets.settleup,
    allTargetsSucceeded: ({ context }) => {
      // An API is "OK" if: not targeted OR (has result AND no error)
      const ynabOk = !context.targets.ynab || (!!context.results.ynab && !context.errors.ynab);
      const settleupOk = !context.targets.settleup || (!!context.results.settleup && !context.errors.settleup);
      return ynabOk && settleupOk;
    },
    partialTargetsSucceeded: ({ context }) => {
      // Only check APIs that were actually targeted
      const targetedApis = [];
      const successfulApis = [];
      
      if (context.targets.ynab) {
        targetedApis.push('ynab');
        if (context.results.ynab && !context.errors.ynab) {
          successfulApis.push('ynab');
        }
      }
      
      if (context.targets.settleup) {
        targetedApis.push('settleup');
        if (context.results.settleup && !context.errors.settleup) {
          successfulApis.push('settleup');
        }
      }
      
      // Partial success: multiple targets AND some (but not all) succeeded
      return targetedApis.length > 1 && 
             successfulApis.length > 0 && 
             successfulApis.length < targetedApis.length;
    },
  },
});
