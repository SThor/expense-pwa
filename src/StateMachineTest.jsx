import React from 'react';
import { useMachine } from '@xstate/react';
import { fromPromise } from 'xstate';
import { apiSyncStateMachine } from './machines/apiSyncStateMachine';
import ApiSyncStepper from './components/ApiSyncStepper';

function StateMachineTest() {
  const [ynabResolver, setYnabResolver] = React.useState(null);
  const [settleupResolver, setSettleupResolver] = React.useState(null);
  
  // Create mock formState objects for testing
  const createMockFormState = (target) => ({
    amountMilliunits: 25000, // $25.00
    description: "Test Transaction",
    target,
    account: { bourso: true, swile: false },
    payee: "Test Merchant",
    payeeId: "test-payee-id",
    category: "Groceries",
    categoryId: "test-category-id",
    date: new Date(),
    settleUpCategory: "Food",
    settleUpGroups: null,
    settleUpGroup: null,
    settleUpPayerId: "",
    settleUpMembers: [],
    settleUpCurrency: "EUR",
    swileMilliunits: 25000,
    showAccounts: false,
    showDetails: false,
  });
  
  // Add debugging
  React.useEffect(() => {
    console.log('ynabResolver updated:', ynabResolver);
  }, [ynabResolver]);
  
  React.useEffect(() => {
    console.log('settleupResolver updated:', settleupResolver);
  }, [settleupResolver]);
  
  // Create machine with proper actor override using .provide()
  const machineWithActors = React.useMemo(() => {
    return apiSyncStateMachine.provide({
      actors: {
        submitYnab: fromPromise(() => {
          console.log('YNAB service started - waiting for user input');
          return new Promise((resolve, reject) => {
            setYnabResolver({ resolve, reject });
          });
        }),
        submitSettleup: fromPromise(() => {
          console.log('SettleUp service started - waiting for user input');
          return new Promise((resolve, reject) => {
            setSettleupResolver({ resolve, reject });
          });
        }),
      },
    });
  }, [setYnabResolver, setSettleupResolver]);

  const [state, send] = useMachine(machineWithActors);
  
  // Add state change debugging
  React.useEffect(() => {
    console.log('State changed:', state.value, 'Context:', state.context);
  }, [state]);

  // Helper function to get current state path
  const getStatePath = (state) => {
    const paths = [];
    if (state.matches('idle')) paths.push('idle');
    if (state.matches('success')) paths.push('success');
    if (state.matches('error')) paths.push('error');
    if (state.matches('partialSuccess')) paths.push('partialSuccess');
    
    if (state.matches('syncing')) {
      paths.push('syncing');
      
      // Check YNAB substate
      if (state.matches({ syncing: { ynab: 'checking' } })) paths.push('syncing.ynab.checking');
      if (state.matches({ syncing: { ynab: 'skipped' } })) paths.push('syncing.ynab.skipped');
      if (state.matches({ syncing: { ynab: 'submitting' } })) paths.push('syncing.ynab.submitting');
      if (state.matches({ syncing: { ynab: 'success' } })) paths.push('syncing.ynab.success');
      if (state.matches({ syncing: { ynab: 'error' } })) paths.push('syncing.ynab.error');
      
      // Check SettleUp substate  
      if (state.matches({ syncing: { settleup: 'checking' } })) paths.push('syncing.settleup.checking');
      if (state.matches({ syncing: { settleup: 'skipped' } })) paths.push('syncing.settleup.skipped');
      if (state.matches({ syncing: { settleup: 'submitting' } })) paths.push('syncing.settleup.submitting');
      if (state.matches({ syncing: { settleup: 'success' } })) paths.push('syncing.settleup.success');
      if (state.matches({ syncing: { settleup: 'error' } })) paths.push('syncing.settleup.error');
    }
    
    return paths;
  };

  return (
    <div style={{ fontFamily: 'monospace', padding: '20px' }}>
      <h1>State Machine Tester</h1>
      
      {/* Current State */}
      <div style={{ background: '#f0f0f0', padding: '10px', marginBottom: '20px' }}>
        <h3>Current States:</h3>
        <ul>
          {getStatePath(state).map(path => (
            <li key={path} style={{ color: '#0066cc', fontWeight: 'bold' }}>{path}</li>
          ))}
        </ul>
      </div>

      {/* API Sync Stepper */}
      <ApiSyncStepper state={state} context={state.context} />

      {/* Context Display */}
      <div style={{ background: '#e8f4f8', padding: '10px', marginBottom: '20px' }}>
        <h3>Context:</h3>
        <pre>{JSON.stringify(state.context, null, 2)}</pre>
      </div>

      {/* Debug Info */}
      <div style={{ background: '#fff3cd', padding: '10px', marginBottom: '20px', border: '1px solid #ffeaa7' }}>
        <h3>Debug Info:</h3>
        <p>YNAB Resolver: {ynabResolver ? 'SET' : 'NULL'}</p>
        <p>SettleUp Resolver: {settleupResolver ? 'SET' : 'NULL'}</p>
        <p>Check browser console for detailed logs</p>
      </div>

      {/* Start Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Start Sync:</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={() => send({ 
              type: 'START_SYNC', 
              formState: createMockFormState({ ynab: true, settleup: false })
            })}
            disabled={!state.matches('idle')}
            style={{
              padding: '12px 24px',
              backgroundColor: state.matches('idle') ? '#007bff' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: state.matches('idle') ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            YNAB Only
          </button>
          <button 
            onClick={() => send({ 
              type: 'START_SYNC', 
              formState: createMockFormState({ ynab: false, settleup: true })
            })}
            disabled={!state.matches('idle')}
            style={{
              padding: '12px 24px',
              backgroundColor: state.matches('idle') ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: state.matches('idle') ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            SettleUp Only
          </button>
          <button 
            onClick={() => send({ 
              type: 'START_SYNC', 
              formState: createMockFormState({ ynab: true, settleup: true })
            })}
            disabled={!state.matches('idle')}
            style={{
              padding: '12px 24px',
              backgroundColor: state.matches('idle') ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: state.matches('idle') ? 'pointer' : 'not-allowed',
              transition: 'background-color 0.2s'
            }}
          >
            Both APIs
          </button>
        </div>
      </div>

      {/* API Control Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Control API Outcomes:</h3>
        
        {/* YNAB Controls */}
        <div style={{ marginBottom: '10px' }}>
          <strong>YNAB API:</strong>
          <button 
            onClick={() => {
              if (ynabResolver) {
                ynabResolver.resolve('✅ YNAB transaction sent!');
                setYnabResolver(null);
              }
            }}
            disabled={!ynabResolver}
            style={{ 
              marginLeft: '10px', 
              padding: '8px 16px',
              backgroundColor: ynabResolver ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: ynabResolver ? 'pointer' : 'not-allowed'
            }}
          >
            Success YNAB
          </button>
          <button 
            onClick={() => {
              if (ynabResolver) {
                ynabResolver.reject(new Error('YNAB API error: Network timeout'));
                setYnabResolver(null);
              }
            }}
            disabled={!ynabResolver}
            style={{ 
              marginLeft: '10px', 
              padding: '8px 16px',
              backgroundColor: ynabResolver ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: ynabResolver ? 'pointer' : 'not-allowed'
            }}
          >
            Fail YNAB
          </button>
          {ynabResolver && <span style={{ color: '#ff9800', marginLeft: '10px', fontWeight: 'bold' }}>⏳ Waiting...</span>}
        </div>

        {/* SettleUp Controls */}
        <div>
          <strong>SettleUp API:</strong>
          <button 
            onClick={() => {
              if (settleupResolver) {
                settleupResolver.resolve('✅ SettleUp transaction sent!');
                setSettleupResolver(null);
              }
            }}
            disabled={!settleupResolver}
            style={{ 
              marginLeft: '10px', 
              padding: '8px 16px',
              backgroundColor: settleupResolver ? '#28a745' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: settleupResolver ? 'pointer' : 'not-allowed'
            }}
          >
            Success SettleUp
          </button>
          <button 
            onClick={() => {
              if (settleupResolver) {
                settleupResolver.reject(new Error('Error adding transaction: Invalid permissions'));
                setSettleupResolver(null);
              }
            }}
            disabled={!settleupResolver}
            style={{ 
              marginLeft: '10px', 
              padding: '8px 16px',
              backgroundColor: settleupResolver ? '#dc3545' : '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: settleupResolver ? 'pointer' : 'not-allowed'
            }}
          >
            Fail SettleUp
          </button>
          {settleupResolver && <span style={{ color: '#ff9800', marginLeft: '10px', fontWeight: 'bold' }}>⏳ Waiting...</span>}
        </div>
      </div>

      {/* Final State Controls */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Final State Actions:</h3>
        <button 
          onClick={() => send({ type: 'RESET' })}
          disabled={state.matches('idle') || state.matches('syncing')}
          style={{ 
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: (!state.matches('idle') && !state.matches('syncing')) ? '#6c757d' : '#f8f9fa',
            color: (!state.matches('idle') && !state.matches('syncing')) ? 'white' : '#6c757d',
            border: '1px solid #6c757d',
            borderRadius: '4px',
            cursor: (!state.matches('idle') && !state.matches('syncing')) ? 'pointer' : 'not-allowed'
          }}
        >
          RESET
        </button>
        <button 
          onClick={() => send({ type: 'RETRY' })}
          disabled={!state.matches('error')}
          style={{ 
            marginRight: '10px',
            padding: '10px 20px',
            backgroundColor: state.matches('error') ? '#ffc107' : '#f8f9fa',
            color: state.matches('error') ? 'black' : '#6c757d',
            border: '1px solid #ffc107',
            borderRadius: '4px',
            cursor: state.matches('error') ? 'pointer' : 'not-allowed'
          }}
        >
          RETRY (Full)
        </button>
        <button 
          onClick={() => send({ type: 'RETRY_FAILED' })}
          disabled={!state.matches('partialSuccess')}
          style={{ 
            padding: '10px 20px',
            backgroundColor: state.matches('partialSuccess') ? '#17a2b8' : '#f8f9fa',
            color: state.matches('partialSuccess') ? 'white' : '#6c757d',
            border: '1px solid #17a2b8',
            borderRadius: '4px',
            cursor: state.matches('partialSuccess') ? 'pointer' : 'not-allowed'
          }}
        >
          RETRY_FAILED (Partial)
        </button>
      </div>

      {/* Instructions */}
      <div style={{ background: '#fff3cd', padding: '10px', border: '1px solid #ffeaa7' }}>
        <h4>Instructions:</h4>
        <ol>
          <li>Click one of the "Start Sync" buttons to select which APIs to call</li>
          <li>When APIs start (⏳ Waiting...), use Success/Fail buttons to control outcomes</li>
          <li>Watch how the state machine transitions based on your choices</li>
          <li>Test different combinations: both succeed, both fail, one of each</li>
        </ol>
      </div>
    </div>
  );
}

export default StateMachineTest;