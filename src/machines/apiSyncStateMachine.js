import { createMachine, assign, fromPromise } from 'xstate';

export const apiSyncStateMachine = createMachine({
  id: 'apiSync',
  initial: 'idle',
  context: {
    formState: null,                           // Complete transaction data
    results: { ynab: null, settleup: null },   // API results
    errors: { ynab: null, settleup: null },    // API errors
  },
  states: {
    idle: {
      on: {
        START_SYNC: {
          target: 'syncing',
          actions: assign({
            formState: ({ event }) => event.formState,
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
                    params: ({ context }) => ({ formState: context.formState })
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
                    params: ({ context }) => ({ formState: context.formState })
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
        RESET: { 
          target: 'idle',
          actions: assign({
            formState: null,
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
      },
    },

    partialSuccess: {
      on: {
        RETRY_FAILED: {
          target: 'syncing',
          actions: assign({
            formState: ({ context }) => ({
              ...context.formState,
              target: {
                ynab: context.formState.target.ynab && !!context.errors.ynab,
                settleup: context.formState.target.settleup && !!context.errors.settleup,
              }
            }),
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
        RESET: { 
          target: 'idle',
          actions: assign({
            formState: null,
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
      },
    },

    error: {
      on: {
        RETRY: { 
          target: 'syncing',
          actions: assign({
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
        RESET: { 
          target: 'idle',
          actions: assign({
            formState: null,
            results: { ynab: null, settleup: null },
            errors: { ynab: null, settleup: null },
          }),
        },
      },
    },
  },
}, {
  guards: {
    ynabTargeted: ({ context }) => context.formState?.target?.ynab || false,
    settleupTargeted: ({ context }) => context.formState?.target?.settleup || false,
    allTargetsSucceeded: ({ context }) => {
      // An API is "OK" if: not targeted OR (has result AND no error)
      const ynabOk = !context.formState?.target?.ynab || (!!context.results.ynab && !context.errors.ynab);
      const settleupOk = !context.formState?.target?.settleup || (!!context.results.settleup && !context.errors.settleup);
      return ynabOk && settleupOk;
    },
    partialTargetsSucceeded: ({ context }) => {
      // Only check APIs that were actually targeted
      const targetedApis = [];
      const successfulApis = [];
      
      if (context.formState?.target?.ynab) {
        targetedApis.push('ynab');
        if (context.results.ynab && !context.errors.ynab) {
          successfulApis.push('ynab');
        }
      }
      
      if (context.formState?.target?.settleup) {
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
