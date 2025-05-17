import type { MigrationFn } from '@ninjalib/sql';
import v0_0_1 from './v0_0_1';
import v0_0_2 from './v0_0_2';
import v0_1_0 from './v0_1_0';
import v0_1_1 from './v0_1_1';
import v0_2_0 from './v0_2_0';
import v0_3_0 from './v0_3_0';
import v0_4_0 from './v0_4_0';

export function migration(runStep: MigrationFn) {
	v0_0_1(runStep);
	v0_0_2(runStep);
	v0_1_0(runStep);
	v0_1_1(runStep);
	v0_2_0(runStep);
	v0_3_0(runStep);
	v0_4_0(runStep);
}
