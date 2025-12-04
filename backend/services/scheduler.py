"""
Background scheduler for periodic sync jobs.
"""

import logging
import asyncio
from datetime import datetime, timedelta
from typing import Optional, Callable, Awaitable
from contextlib import asynccontextmanager

logger = logging.getLogger(__name__)


class SyncScheduler:
    """
    Background scheduler for running periodic sync tasks.
    """

    def __init__(self):
        self._task: Optional[asyncio.Task] = None
        self._running = False
        self._sync_interval = 6 * 3600  # 6 hours default
        self._last_sync: Optional[datetime] = None
        self._sync_func: Optional[Callable[[], Awaitable]] = None
        self._on_sync_complete: Optional[Callable[[dict], None]] = None

    def configure(
        self,
        sync_func: Callable[[], Awaitable],
        interval_hours: float = 6,
        on_complete: Optional[Callable[[dict], None]] = None,
    ):
        """
        Configure the scheduler.

        Args:
            sync_func: Async function to run periodically
            interval_hours: Hours between syncs
            on_complete: Callback when sync completes
        """
        self._sync_func = sync_func
        self._sync_interval = interval_hours * 3600
        self._on_sync_complete = on_complete

    async def start(self):
        """Start the scheduler."""
        if self._running:
            logger.warning("Scheduler already running")
            return

        if not self._sync_func:
            logger.error("No sync function configured")
            return

        self._running = True
        self._task = asyncio.create_task(self._run_loop())
        logger.info(f"Scheduler started (interval: {self._sync_interval / 3600:.1f} hours)")

    async def stop(self):
        """Stop the scheduler."""
        self._running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Scheduler stopped")

    async def _run_loop(self):
        """Main scheduler loop."""
        # Run initial sync
        await self._run_sync()

        while self._running:
            try:
                # Wait for next interval
                await asyncio.sleep(self._sync_interval)

                if self._running:
                    await self._run_sync()

            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"Scheduler error: {e}")
                # Wait before retrying
                await asyncio.sleep(300)  # 5 minutes

    async def _run_sync(self):
        """Execute a sync."""
        if not self._sync_func:
            return

        logger.info("Starting scheduled sync...")
        start_time = datetime.utcnow()

        try:
            result = await self._sync_func()
            self._last_sync = datetime.utcnow()

            duration = (self._last_sync - start_time).total_seconds()
            logger.info(f"Sync completed in {duration:.1f}s")

            if self._on_sync_complete:
                self._on_sync_complete(result)

        except Exception as e:
            logger.error(f"Sync failed: {e}")

    async def trigger_sync(self) -> dict:
        """Manually trigger a sync."""
        if not self._sync_func:
            return {"error": "No sync function configured"}

        logger.info("Manual sync triggered")
        return await self._sync_func()

    def get_status(self) -> dict:
        """Get scheduler status."""
        next_sync = None
        if self._last_sync:
            next_sync = self._last_sync + timedelta(seconds=self._sync_interval)

        return {
            "running": self._running,
            "interval_hours": self._sync_interval / 3600,
            "last_sync": self._last_sync.isoformat() if self._last_sync else None,
            "next_sync": next_sync.isoformat() if next_sync else None,
        }


# Global scheduler instance
sync_scheduler = SyncScheduler()


@asynccontextmanager
async def scheduler_lifespan():
    """Context manager for scheduler lifecycle."""
    from backend.scrapers.aggregator import build_aggregator

    # Configure with build aggregator sync
    sync_scheduler.configure(
        sync_func=lambda: build_aggregator.sync_all_sources(),
        interval_hours=6,
    )

    # Start scheduler
    await sync_scheduler.start()

    yield

    # Stop scheduler
    await sync_scheduler.stop()
