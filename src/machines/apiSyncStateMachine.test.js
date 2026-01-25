import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createActor, fromPromise } from "xstate";

import { apiSyncStateMachine } from "./apiSyncStateMachine";

describe("apiSyncStateMachine", () => {
  // Mock formState helper
  const createMockFormState = (target = { ynab: true, settleup: false }) => ({
    amountMilliunits: 25000,
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

  describe("Initial State", () => {
    it("should start in idle state with correct initial context", () => {
      const actor = createActor(apiSyncStateMachine);
      actor.start();

      expect(actor.getSnapshot().value).toBe("idle");
      expect(actor.getSnapshot().context).toEqual({
        formState: null,
        results: { ynab: null, settleup: null },
        errors: { ynab: null, settleup: null },
      });

      actor.stop();
    });
  });

  describe("START_SYNC Transitions", () => {
    it("should transition to syncing state and store formState", () => {
      const actor = createActor(apiSyncStateMachine);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      const snapshot = actor.getSnapshot();
      expect(snapshot.matches("syncing")).toBe(true);
      expect(snapshot.context.formState).toEqual(formState);
      expect(snapshot.context.results).toEqual({ ynab: null, settleup: null });
      expect(snapshot.context.errors).toEqual({ ynab: null, settleup: null });

      actor.stop();
    });

    it("should handle YNAB-only target correctly", () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      const snapshot = actor.getSnapshot();
      expect(snapshot.matches({ syncing: { ynab: "submitting" } })).toBe(true);
      expect(snapshot.matches({ syncing: { settleup: "skipped" } })).toBe(true);

      actor.stop();
    });

    it("should handle SettleUp-only target correctly", () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: false, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      const snapshot = actor.getSnapshot();
      expect(snapshot.matches({ syncing: { ynab: "skipped" } })).toBe(true);
      expect(snapshot.matches({ syncing: { settleup: "submitting" } })).toBe(
        true,
      );

      actor.stop();
    });

    it("should handle both APIs target correctly", () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      const snapshot = actor.getSnapshot();
      expect(snapshot.matches({ syncing: { ynab: "submitting" } })).toBe(true);
      expect(snapshot.matches({ syncing: { settleup: "submitting" } })).toBe(
        true,
      );

      actor.stop();
    });
  });

  describe("Guards", () => {
    let actor;

    beforeEach(() => {
      actor = createActor(apiSyncStateMachine);
      actor.start();
    });

    afterEach(() => {
      actor.stop();
    });

    describe("ynabTargeted guard", () => {
      it("should return true when YNAB is targeted", () => {
        const formState = createMockFormState({ ynab: true, settleup: false });
        actor.send({ type: "START_SYNC", formState });

        const snapshot = actor.getSnapshot();
        expect(snapshot.context.formState.target.ynab).toBe(true);
      });

      it("should return false when YNAB is not targeted", () => {
        const formState = createMockFormState({ ynab: false, settleup: true });
        actor.send({ type: "START_SYNC", formState });

        const snapshot = actor.getSnapshot();
        expect(snapshot.context.formState.target.ynab).toBe(false);
      });

      it("should handle null formState gracefully", () => {
        const snapshot = actor.getSnapshot();
        expect(snapshot.context.formState?.target?.ynab || false).toBe(false);
      });
    });

    describe("settleupTargeted guard", () => {
      it("should return true when SettleUp is targeted", () => {
        const formState = createMockFormState({ ynab: false, settleup: true });
        actor.send({ type: "START_SYNC", formState });

        const snapshot = actor.getSnapshot();
        expect(snapshot.context.formState.target.settleup).toBe(true);
      });

      it("should return false when SettleUp is not targeted", () => {
        const formState = createMockFormState({ ynab: true, settleup: false });
        actor.send({ type: "START_SYNC", formState });

        const snapshot = actor.getSnapshot();
        expect(snapshot.context.formState.target.settleup).toBe(false);
      });
    });
  });

  describe("Success Scenarios", () => {
    it("should reach success state when all targeted APIs succeed", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      // Wait for the machine to settle
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("success") ||
            snapshot.matches("error") ||
            snapshot.matches("partialSuccess")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("success")).toBe(true);
      expect(finalSnapshot.context.results.ynab).toBe("YNAB Success");
      expect(finalSnapshot.context.results.settleup).toBe("SettleUp Success");
      expect(finalSnapshot.context.errors.ynab).toBe(null);
      expect(finalSnapshot.context.errors.settleup).toBe(null);

      actor.stop();
    });

    it("should reach success state when only YNAB is targeted and succeeds", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("success") ||
            snapshot.matches("error") ||
            snapshot.matches("partialSuccess")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("success")).toBe(true);
      expect(finalSnapshot.context.results.ynab).toBe("YNAB Success");
      expect(finalSnapshot.context.results.settleup).toBe(null);

      actor.stop();
    });
  });

  describe("Error Scenarios", () => {
    it("should reach error state when single targeted API fails", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("error") ||
            snapshot.matches("success") ||
            snapshot.matches("partialSuccess")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("error")).toBe(true);
      expect(finalSnapshot.context.errors.ynab).toBeInstanceOf(Error);
      expect(finalSnapshot.context.errors.ynab.message).toBe("YNAB Failed");

      actor.stop();
    });

    it("should reach partialSuccess state when one of multiple APIs fails", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("partialSuccess") ||
            snapshot.matches("error") ||
            snapshot.matches("success")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("partialSuccess")).toBe(true);
      expect(finalSnapshot.context.results.ynab).toBe("YNAB Success");
      expect(finalSnapshot.context.errors.settleup).toBeInstanceOf(Error);

      actor.stop();
    });

    it("should reach partialSuccess when YNAB fails but SettleUp succeeds", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("partialSuccess") ||
            snapshot.matches("error") ||
            snapshot.matches("success")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("partialSuccess")).toBe(true);
      expect(finalSnapshot.context.results.settleup).toBe("SettleUp Success");
      expect(finalSnapshot.context.results.ynab).toBe(null);
      expect(finalSnapshot.context.errors.ynab).toBeInstanceOf(Error);
      expect(finalSnapshot.context.errors.ynab.message).toBe("YNAB Failed");
      expect(finalSnapshot.context.errors.settleup).toBe(null);

      actor.stop();
    });

    it("should reach partialSuccess when SettleUp fails but YNAB succeeds", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("partialSuccess") ||
            snapshot.matches("error") ||
            snapshot.matches("success")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("partialSuccess")).toBe(true);
      expect(finalSnapshot.context.results.ynab).toBe("YNAB Success");
      expect(finalSnapshot.context.results.settleup).toBe(null);
      expect(finalSnapshot.context.errors.ynab).toBe(null);
      expect(finalSnapshot.context.errors.settleup).toBeInstanceOf(Error);
      expect(finalSnapshot.context.errors.settleup.message).toBe(
        "SettleUp Failed",
      );

      actor.stop();
    });

    it("should reach error state when all targeted APIs fail", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return (
            snapshot.matches("error") ||
            snapshot.matches("success") ||
            snapshot.matches("partialSuccess")
          );
        },
        { timeout: 1000 },
      );

      const finalSnapshot = actor.getSnapshot();
      expect(finalSnapshot.matches("error")).toBe(true);
      expect(finalSnapshot.context.errors.ynab).toBeInstanceOf(Error);
      expect(finalSnapshot.context.errors.settleup).toBeInstanceOf(Error);

      actor.stop();
    });
  });

  describe("Retry Logic", () => {
    it("should retry all APIs when in error state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      // Wait for error state
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("error");
        },
        { timeout: 1000 },
      );

      // Test RETRY from error state
      actor.send({ type: "RETRY" });
      const retrySnapshot = actor.getSnapshot();
      expect(retrySnapshot.matches("syncing")).toBe(true);
      expect(retrySnapshot.context.results).toEqual({
        ynab: null,
        settleup: null,
      });
      expect(retrySnapshot.context.errors).toEqual({
        ynab: null,
        settleup: null,
      });

      actor.stop();
    });

    it("should retry only failed APIs when in partialSuccess state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      // Wait for partialSuccess
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("partialSuccess");
        },
        { timeout: 1000 },
      );

      // Test RETRY_FAILED
      actor.send({ type: "RETRY_FAILED" });
      const retrySnapshot = actor.getSnapshot();

      expect(retrySnapshot.matches("syncing")).toBe(true);
      // Should only target the failed API (settleup) - ynab was successful so errors.ynab should be null
      expect(retrySnapshot.context.formState.target.ynab).toBe(false); // Was successful, so not retried
      expect(retrySnapshot.context.formState.target.settleup).toBe(true); // Failed, so retried

      actor.stop();
    });

    it("should retry only YNAB when it failed in partialSuccess state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      // Wait for partialSuccess
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("partialSuccess");
        },
        { timeout: 1000 },
      );

      // Test RETRY_FAILED
      actor.send({ type: "RETRY_FAILED" });
      const retrySnapshot = actor.getSnapshot();

      expect(retrySnapshot.matches("syncing")).toBe(true);
      // Should only target the failed API (ynab) - settleup was successful
      expect(retrySnapshot.context.formState.target.ynab).toBe(true); // Failed, so retried
      expect(retrySnapshot.context.formState.target.settleup).toBe(false); // Was successful, so not retried

      actor.stop();
    });
  });

  describe("Reset Functionality", () => {
    it("should reset to idle from success state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("success");
        },
        { timeout: 1000 },
      );

      actor.send({ type: "RESET" });
      const resetSnapshot = actor.getSnapshot();

      expect(resetSnapshot.matches("idle")).toBe(true);
      expect(resetSnapshot.context.formState).toBe(null);
      expect(resetSnapshot.context.results).toEqual({
        ynab: null,
        settleup: null,
      });
      expect(resetSnapshot.context.errors).toEqual({
        ynab: null,
        settleup: null,
      });

      actor.stop();
    });

    it("should reset to idle from error state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() =>
            Promise.reject(new Error("YNAB Failed")),
          ),
          submitSettleup: fromPromise(() =>
            Promise.resolve("SettleUp Success"),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      // Wait for error state
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("error");
        },
        { timeout: 1000 },
      );

      actor.send({ type: "RESET" });
      const resetSnapshot = actor.getSnapshot();

      expect(resetSnapshot.matches("idle")).toBe(true);
      expect(resetSnapshot.context.formState).toBe(null);
      expect(resetSnapshot.context.results).toEqual({
        ynab: null,
        settleup: null,
      });
      expect(resetSnapshot.context.errors).toEqual({
        ynab: null,
        settleup: null,
      });

      actor.stop();
    });

    it("should reset to idle from partialSuccess state", async () => {
      const machineWithMockServices = apiSyncStateMachine.provide({
        actors: {
          submitYnab: fromPromise(() => Promise.resolve("YNAB Success")),
          submitSettleup: fromPromise(() =>
            Promise.reject(new Error("SettleUp Failed")),
          ),
        },
      });

      const actor = createActor(machineWithMockServices);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: true });
      actor.send({ type: "START_SYNC", formState });

      // Wait for partialSuccess
      await vi.waitFor(
        () => {
          const snapshot = actor.getSnapshot();
          return snapshot.matches("partialSuccess");
        },
        { timeout: 1000 },
      );

      actor.send({ type: "RESET" });
      const resetSnapshot = actor.getSnapshot();

      expect(resetSnapshot.matches("idle")).toBe(true);
      expect(resetSnapshot.context.formState).toBe(null);
      expect(resetSnapshot.context.results).toEqual({
        ynab: null,
        settleup: null,
      });
      expect(resetSnapshot.context.errors).toEqual({
        ynab: null,
        settleup: null,
      });

      actor.stop();
    });
  });

  describe("Context Management", () => {
    it("should store formState correctly when START_SYNC is sent", () => {
      const actor = createActor(apiSyncStateMachine);
      actor.start();

      const formState = createMockFormState({ ynab: true, settleup: false });
      actor.send({ type: "START_SYNC", formState });

      const snapshot = actor.getSnapshot();
      expect(snapshot.context.formState.target.ynab).toBe(true);
      expect(snapshot.context.formState.target.settleup).toBe(false);
      expect(snapshot.context.formState.description).toBe("Test Transaction");
      expect(snapshot.context.formState.amountMilliunits).toBe(25000);
      expect(snapshot.context.results).toEqual({ ynab: null, settleup: null });
      expect(snapshot.context.errors).toEqual({ ynab: null, settleup: null });

      actor.stop();
    });
  });
});
