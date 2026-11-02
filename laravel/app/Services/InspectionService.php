<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\User;
use App\Repositories\AqlPlanRepository;
use App\Repositories\ItemRepository;
use App\Repositories\VendorRepository;
use DomainException;
use Illuminate\Support\Facades\DB;

class InspectionService
{
    public function __construct(
        private readonly InspectionCalculator $calculator,
        private readonly AqlPlanRepository $plans,
        private readonly ItemRepository $items,
        private readonly VendorRepository $vendors,
    ) {}

    /**
     * @param  array{
     *     itemid: string,
     *     accountnum: string,
     *     instrument?: string|null,
     *     qfnum?: string|null,
     *     planid: int,
     *     deliveries: array<int, array{po?: string|null, date?: string|null, qty?: string|int|float|null, category?: string|int|null, notgood?: string|int|null, judgment?: string|int|null, note?: string|null}>,
     *     std: list<array<string, mixed>>,
     *     other: list<array<string, mixed>>
     * }  $data
     */
    public function create(array $data, User $user): string
    {
        $item = $this->items->find($data['itemid']);

        if ($item === null) {
            throw new DomainException('Select a valid item.');
        }

        if (! $this->vendors->exists($data['accountnum'])) {
            throw new DomainException('Select a valid vendor.');
        }

        $plan = DB::table('aqlplan')->where('planid', $data['planid'])->first();

        if ($plan === null) {
            throw new DomainException('Select a valid AQL plan.');
        }

        $vendor = $this->vendors->find($data['accountnum']);
        $aql = [];
        $usedDeliveries = 0;

        foreach (range(1, 7) as $column) {
            $delivery = $data['deliveries'][$column] ?? [];
            $qty = (int) round((float) ($delivery['qty'] ?? 0));
            $category = (int) ($delivery['category'] ?? 0);

            if ($qty > 0) {
                $usedDeliveries++;
                $row = $this->plans->rowFor((int) $plan->planid, $category, $qty);

                if ($row === null) {
                    throw new DomainException("No AQL row matches delivery {$column} (quantity {$qty}, category {$this->calculator->categoryLabel($category)}).");
                }

                $aql[$column] = $row;
            }
        }

        if ($usedDeliveries === 0) {
            throw new DomainException('Enter at least one delivery quantity.');
        }

        return DB::transaction(function () use ($data, $user, $item, $vendor, $plan, $aql): string {
            $inspectnum = $this->nextInspectionNumber();
            $now = now();
            $header = [
                'inspectnum' => $inspectnum,
                'inspectdate' => $now->toDateString(),
                'itemid' => $item->itemid,
                'itemname' => $item->name,
                'accountnum' => $vendor->vendaccount,
                'name' => $vendor->name,
                'inspectstatus' => 'DRAFT',
                'instrument' => filled($data['instrument'] ?? null) ? trim((string) $data['instrument']) : null,
                'aqlplanid' => $plan->planid,
                'qfnum' => filled($data['qfnum'] ?? null) ? trim((string) $data['qfnum']) : null,
                'inspectby' => $user->fullname,
                'inspectbyid' => $user->userid,
                'checkedby' => null,
                'created_at' => $now,
                'updated_at' => $now,
            ];

            foreach (range(1, 7) as $column) {
                $delivery = $data['deliveries'][$column] ?? [];
                $row = $aql[$column] ?? null;

                $header['purchordernum'.$column] = filled($delivery['po'] ?? null)
                    ? trim((string) $delivery['po'])
                    : null;
                $header['deliverydate'.$column] = filled($delivery['date'] ?? null)
                    ? $delivery['date']
                    : null;
                $header['qty_received'.$column] = (float) ($delivery['qty'] ?? 0);
                $header['inspectcategory'.$column] = (int) ($delivery['category'] ?? 0);
                $header['notgood'.$column] = (int) ($delivery['notgood'] ?? 0);
                $header['judgment'.$column] = (int) ($delivery['judgment'] ?? 0);
                $header['samplesize'.$column] = $row?->samplesize;
                $header['acceptnum'.$column] = $row?->acceptnum;
                $header['rejectnum'.$column] = $row?->rejectnum;
                $header['concessionnote'.$column] = filled($delivery['note'] ?? null)
                    ? trim((string) $delivery['note'])
                    : null;
            }

            DB::table('inspecttable')->insert($header);

            foreach ($data['std'] as $index => $line) {
                $row = [
                    'inspectnum' => $inspectnum,
                    'linenum' => $index + 1,
                    'inspecttype' => 'STD',
                    'inspectitem' => trim((string) ($line['inspectitem'] ?? '')),
                    'standard_txt' => filled($line['standard_txt'] ?? null) ? trim((string) $line['standard_txt']) : null,
                    'standard' => is_numeric($line['standard'] ?? null) ? $line['standard'] : null,
                    'tolerance' => 0,
                    'tolerance_txt' => filled($line['tolerance'] ?? null) ? trim((string) $line['tolerance']) : null,
                    'tolerance_plus' => is_numeric($line['tolerance_plus'] ?? null) ? $line['tolerance_plus'] : 0,
                    'tolerance_minus' => is_numeric($line['tolerance_minus'] ?? null) ? $line['tolerance_minus'] : 0,
                ];

                foreach (range(1, 7) as $column) {
                    $actual = $line['actuals'][$column] ?? null;
                    $row['actual_'.$column] = $actual === '' || $actual === null ? null : $actual;
                    $row['status_'.$column] = $this->calculator->standardStatus(
                        $actual,
                        $line['standard'] ?? null,
                        $line['tolerance_plus'] ?? 0,
                        $line['tolerance_minus'] ?? 0,
                    );
                }

                DB::table('inspectline')->insert($row);
            }

            foreach ($data['other'] as $index => $line) {
                $row = [
                    'inspectnum' => $inspectnum,
                    'linenum' => $index + 1,
                    'inspecttype' => trim((string) ($line['inspecttype'] ?? '')),
                    'inspectitem' => trim((string) ($line['inspectitem'] ?? '')),
                    'standard_txt' => filled($line['standard_txt'] ?? null) ? trim((string) $line['standard_txt']) : null,
                ];

                foreach (range(1, 7) as $column) {
                    $actual = trim((string) ($line['actuals'][$column] ?? ''));
                    $status = $line['statuses'][$column] ?? null;

                    $row['actual_txt_'.$column] = $actual !== '' ? $actual : null;
                    $row['status_'.$column] = $actual === '' || $status === '' || $status === null ? null : (int) $status;
                }

                DB::table('inspectlineother')->insert($row);
            }

            return $inspectnum;
        });
    }

    private function nextInspectionNumber(): string
    {
        $prefix = 'INS-';
        $sequence = DB::table('inspectnumseq')->where('prefix', $prefix)->lockForUpdate()->first();

        if ($sequence === null) {
            DB::table('inspectnumseq')->insert([
                'prefix' => $prefix,
                'digits' => 6,
                'nextnum' => 1,
            ]);
            $sequence = (object) ['prefix' => $prefix, 'digits' => 6, 'nextnum' => 1];
        }

        $number = $prefix.str_pad((string) $sequence->nextnum, (int) $sequence->digits, '0', STR_PAD_LEFT);

        DB::table('inspectnumseq')
            ->where('prefix', $prefix)
            ->update(['nextnum' => (int) $sequence->nextnum + 1]);

        return $number;
    }
}
