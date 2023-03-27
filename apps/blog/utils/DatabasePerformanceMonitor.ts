import type { DatabasePerformanceCallbacks } from '@dossierhq/server';

export class DatabasePerformanceMonitor implements DatabasePerformanceCallbacks {
  queryCount = 0;
  queryDuration = 0;
  rootTransactionCount = 0;
  rootTransactionDuration = 0;
  rootTransactionAcquisitionCount = 0;
  rootTransactionAcquisitionDuration = 0;

  onQueryCompleted(_query: string, _success: boolean, duration: number) {
    this.queryCount++;
    this.queryDuration += duration;
  }

  onRootTransactionAcquired(duration: number) {
    this.rootTransactionAcquisitionCount++;
    this.rootTransactionAcquisitionDuration += duration;
  }

  onRootTransactionCompleted(duration: number) {
    this.rootTransactionCount++;
    this.rootTransactionDuration += duration;
  }

  getServerTimingHeader() {
    const metrics = [];
    if (this.queryCount > 0) {
      metrics.push(`db;desc="${this.queryCount} queries";dur=${this.queryDuration.toFixed(2)}`);
    }
    if (this.rootTransactionCount > 0) {
      metrics.push(
        `tx;desc="${this.rootTransactionCount} tx";dur=${this.rootTransactionDuration.toFixed(2)}`
      );
    }
    if (this.rootTransactionAcquisitionCount > 0) {
      metrics.push(
        `tx-acq;desc="${
          this.rootTransactionAcquisitionCount
        } tx-acq";dur=${this.rootTransactionAcquisitionDuration.toFixed(2)}`
      );
    }
    return metrics.join(', ');
  }
}
