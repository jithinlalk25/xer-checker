/** Missing links: pass if the % of checked activities missing a link is at most this. */
export const MISSING_LINKS_MAX_PCT = 5;

/** Negative float: pass only if the count is at most this (none allowed). */
export const NEGATIVE_FLOAT_MAX_COUNT = 0;

/** High float: an activity is flagged when its total float is above this many working days. */
export const HIGH_FLOAT_DAYS = 44;

/** High float: pass if the % of checked activities with float that are flagged is at most this. */
export const HIGH_FLOAT_MAX_PCT = 5;

/** Hours per working day used when an activity's calendar is missing or has no hours per day. */
export const DEFAULT_HOURS_PER_DAY = 8;

/** Longest raw-line excerpt kept on a broken row. */
export const EXCERPT_MAX_CHARS = 160;

/** P6 codes used by the rules. */
export const STATUS_COMPLETE = 'TK_Complete';
export const TYPE_START_MILESTONE = 'TT_Mile';
export const TYPE_FINISH_MILESTONE = 'TT_FinMile';
export const TYPE_LEVEL_OF_EFFORT = 'TT_LOE';
export const TYPE_WBS_SUMMARY = 'TT_WBS';
