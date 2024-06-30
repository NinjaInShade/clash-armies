<script lang="ts" context="module">
	import type { ComponentType } from 'svelte';
	type Component = [ComponentType, Record<string, any>];
	export type Column<Row> = {
		key: string;
		label?: string;
		width?: string;
		minWidth?: string;
		maxWidth?: string;
		// FIX... typescript will complain if string isn't here (as const doesn't help)
		align?: 'left' | 'center' | 'right' | string;
		/** Tooltip */
		title?: ((row: Row) => string) | string;
		/**
		 * This can be used to override the value that is used for any sort of sorting/filtering
		 * */
		value?: ((row: Row) => any) | any;
		/** Used to override the value that is rendered in a cell */
		render?: ((row: Row) => any) | any;
		/** Renders a component */
		component?: ((row: Row) => Component | [Component, Record<string, any>]) | Component;
		/** Styles the cell */
		cellStyle?: string;
	};
</script>

<script lang="ts">
	type RowData = Record<string, any>;
	type Row = $$Generic<RowData>;

	type Props = {
		/** Columns to display */
		columns: Column<Row>[];
		/** The data that will be displayed, matching to the shape of the columns */
		data: Row[];
		/** Sets the default column key to sort by @default "First column's key" */
		defaultSortKey?: string;
		/** Sets the default sorting direction @default "Desc" */
		defaultSortDir?: 'asc' | 'desc';
		/** The selected rows (must use the rows 'id' field) */
		selectedKeys?: number[];
		/** Defines whether the table's rows are selectable @default true */
		selectable?: boolean;
		/** Defines whether the table is sortable @default true */
		sortable?: boolean;
		/** Function that fires of upon selection of a row */
		onSelect?: (row: Row, e: KeyboardEvent | MouseEvent) => Promise<void> | void;
	};
	let { columns, data, defaultSortKey, defaultSortDir = 'desc', selectedKeys = $bindable(), selectable = true, sortable = true, onSelect }: Props = $props();

	const minColWidth = 50;
	const yPadding = 12;
	const xPadding = 12;

	let sortKey = $state<string | null>(defaultSortKey || columns[0].key);
	let sortDir = $state(defaultSortDir);

	// the final, processed data that is displayed in the table
	let tableData: Row[] = $derived.by(() => {
		const originalData = [...data];
		if (!sortKey || !sortable) {
			return originalData;
		} else {
			return sortData(originalData, sortKey, sortDir);
		}
	});

	/**
	 * Sort table data by the field provided (sorts in place, returns the same data array)
	 * TODO: use getRawValue() here
	 */
	function sortData(data: Row[], field: string, order: 'asc' | 'desc' = 'asc') {
		const sortedData = [...data];

		// Use this and if true convert value's into dates and compare times?
		// const isParsableDate = (value: Row[keyof Row]) => {
		//     return !isNaN(Date.parse(value));
		// }

		sortedData.sort((a: Row, b: Row) => {
			const valueA = getRawValue(
				a,
				columns.find((col) => col.key === field)
			);
			const valueB = getRawValue(
				b,
				columns.find((col) => col.key === field)
			);

			if (typeof valueA === 'string') {
				return valueA.localeCompare(valueB);
			} else {
				return +valueA - +valueB;
			}
		});

		if (order === 'desc') {
			sortedData.reverse();
		}

		return sortedData;
	}

	const setSort = (key: string) => {
		if (!sortable) {
			return;
		}

		if (sortKey !== key) {
			sortKey = key;
			sortDir = 'desc';
			return;
		}

		if (sortDir === 'desc') {
			sortDir = 'asc';
		} else if (sortDir === 'asc') {
			sortKey = null;
		} else {
			sortDir = 'desc';
		}
	};

	function getRawValue(row: Row, col: Column<Row>) {
		if (!col) {
			return null;
		}

		let value;
		if (typeof col.value === 'function') {
			value = col.value(row);
		} else if (col.value) {
			value = col.value;
		} else {
			value = row[col.key];
		}
		return value;
	}

	const getRenderedValue = (row: Row, col: Column<Row>) => {
		let value;
		if (typeof col.render === 'function') {
			value = col.render(row);
		} else if (col.render) {
			value = col.render;
		} else {
			value = getRawValue(row, col);
		}

		return value ?? '-';
	};

	const getTitle = (row: Row, col: Column<Row>) => {
		if (typeof col.title === 'function') {
			return col.title(row);
		} else if (col.title) {
			return col.title;
		} else {
			return getRawValue(row, col);
		}
	};

	const handleEnter = async (row: Row, e: KeyboardEvent) => {
		if (e.key !== 'Enter') {
			return;
		}
		await handleSelect(row, e);
	};

	const handleSelect = async (row: Row, e: KeyboardEvent | MouseEvent) => {
		if (!selectable) {
			return;
		}
		let selectedRow: any | null = row;
		if (selectedKeys) {
			if (e.ctrlKey && selectedKeys.includes(row.id)) {
				selectedRow = null;
				selectedKeys = [];
			} else {
				selectedKeys = [row.id];
			}
		}
		if (onSelect) {
			await onSelect(selectedRow, e);
		}
	};

	const getCellStyle = (col: Column<Row>) => {
		const styles: string[] = ['display: flex', 'align-items: center', 'justify-content: flex-start'];

		// Alignment
		if (col.align === 'center') {
			styles.push('justify-content: center');
		} else if (col.align === 'right') {
			styles.push('justify-content: flex-end');
		}

		// Width
		styles.push(`min-width: ${col.minWidth ?? col.width ?? `${minColWidth}px`}`);
		styles.push(`max-width: ${col.width ?? col.maxWidth ?? 'none'}`);

		if (typeof col.cellStyle === 'string') {
			styles.push(col.cellStyle);
		}

		return styles.join('; ');
	};
</script>

<div class="table-container" style="--yPadding: {yPadding}px; --xPadding: {xPadding}px;">
	<table class="table" class:selectable>
		<thead>
			<tr>
				{#each columns as col}
					{@const style = getCellStyle(col)}
					<th {style} class="th-cell">
						<button style="cursor: {sortable ? 'pointer' : 'unset'}" onclick={() => setSort(col.key)}>
							{col.label ?? col.key}
							{#if sortable && sortKey && sortKey === col.key}
								<svg
									width="17.75"
									height="14"
									viewBox="0 0 568 448"
									fill="none"
									xmlns="http://www.w3.org/2000/svg"
									style={sortDir === 'asc' ? 'transform: rotateX(180deg)' : ''}
									class="table-header-sort-icon"
								>
									<path
										d="M143.6 10.4C137.5 3.8 129 0 120 0C111 0 102.5 3.8 96.4 10.4L8.4 106.4C-3.5 119.4 -2.7 139.7 10.4 151.6C23.5 163.5 43.7 162.7 55.6 149.6L88 114.3V416C88 433.7 102.3 448 120 448C137.7 448 152 433.7 152 416V114.3L184.4 149.7C196.3 162.7 216.6 163.6 229.6 151.7C242.6 139.8 243.5 119.5 231.6 106.5L143.6 10.5V10.4ZM312 448H344C361.7 448 376 433.7 376 416C376 398.3 361.7 384 344 384H312C294.3 384 280 398.3 280 416C280 433.7 294.3 448 312 448ZM312 320H408C425.7 320 440 305.7 440 288C440 270.3 425.7 256 408 256H312C294.3 256 280 270.3 280 288C280 305.7 294.3 320 312 320ZM312 192H472C489.7 192 504 177.7 504 160C504 142.3 489.7 128 472 128H312C294.3 128 280 142.3 280 160C280 177.7 294.3 192 312 192ZM312 64H536C553.7 64 568 49.7 568 32C568 14.3 553.7 0 536 0H312C294.3 0 280 14.3 280 32C280 49.7 294.3 64 312 64Z"
										fill="var(--grey-400)"
									/>
								</svg>
							{/if}
						</button>
					</th>
				{/each}
			</tr>
		</thead>
		<tbody>
			{#each tableData as row}
				<tr
					class:selected={selectedKeys && selectedKeys.includes(row.id)}
					onclick={async (e) => await handleSelect(row, e)}
					onkeydown={async (e) => await handleEnter(row, e)}
					tabindex={selectable ? 0 : null}
				>
					{#each columns as col}
						{@const title = getTitle(row, col)}
						{@const style = getCellStyle(col)}
						{#if col.component}
							{@const c = typeof col.component === 'function' ? col.component(row) : col.component}
							<td {style} {title} class="cell">
								<svelte:component this={c[0]} {...c[1]} />
							</td>
						{:else}
							{@const renderedValue = getRenderedValue(row, col)}
							<td {style} {title} class="cell" class:cell-null={renderedValue === '-'}>
								{renderedValue}
							</td>
						{/if}
					{/each}
				</tr>
			{:else}
				<tr class="no-data">
					<td class="no-data-text"> No data available... </td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style>
	.table-container {
		position: relative;
		background-color: var(--grey-1000);
		border: 1px solid var(--grey-600);
		border-radius: 4px;
		overflow-x: auto;
		flex: 1 0 0px;
		width: 100%;
	}

	.table {
		display: flex;
		flex-flow: column nowrap;
		border-spacing: 0;
		min-width: 100%;
		height: auto;
	}

	thead,
	tbody {
		display: contents;
	}

	thead tr {
		position: sticky;
		top: -1px;
	}

	tr {
		display: flex;
		border: 1px solid transparent;
	}

	th {
		background-color: var(--grey-900);
		border-bottom: 1px solid var(--grey-600);
		height: 50px;
	}

	td {
		background-color: var(--grey-1000);
		font-size: var(--fs);
		line-height: var(--fs-lh);
		color: var(--grey-300);
	}

	th,
	td {
		transition: all 0.1s ease-in-out;
		padding: var(--yPadding) var(--xPadding);
		overflow-x: hidden;
		user-select: none;
		white-space: nowrap;
		flex: 1 0 0px;
	}

	th:not(:last-child),
	td:not(:last-child) {
		border-right: 1px solid var(--grey-600);
	}

	/*
    * Cell is the actual user data that is rendered, not any other custom element like the no-data section
    */
	.cell {
		white-space: nowrap;
		height: 50px;
		border-bottom: 1px solid var(--grey-600);
	}

	.cell-null {
		color: var(--grey-600);
	}

	.table.selectable .cell {
		cursor: pointer;
	}

	.selectable tr:hover,
	.selectable tr:focus,
	.selectable tr:focus-visible,
	.selected {
		outline: none;
		background: none;
		border: 1px solid var(--primary-400);
	}

	.selectable tr:hover .cell,
	.selectable tr:focus .cell,
	.selectable tr:focus-visible .cell,
	.selected .cell {
		background-color: var(--grey-900);
	}

	.th-cell button {
		display: inline-flex;
		justify-content: flex-start;
		align-items: center;
		font-size: var(--fs);
		line-height: var(--fs);
		color: var(--grey-100);
		font-weight: 600;
		padding: 2px;
		gap: 6px;
	}

	.th-cell button:focus {
		outline: var(--primary-400) dotted 2px;
	}

	/* No data */
	.no-data {
		display: flex;
		align-items: center;
		justify-content: center;
		flex: 1 0 0px;
		padding: 0.25em;
	}

	.no-data-text {
		text-align: center;
		color: var(--grey-500);
	}
</style>
