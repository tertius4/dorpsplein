import type { ListingKind } from '../../db/index.ts';
import { jobKind } from './job.ts';
import type { KindModule } from './types.ts';

/** 'n Nuwe `ListingKind` gee 'n kompileerfout totdat sy module hier geregistreer is. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const kinds = { JOB: jobKind } satisfies Record<ListingKind, KindModule<any>>;
