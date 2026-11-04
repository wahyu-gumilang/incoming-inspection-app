<?php

declare(strict_types=1);

namespace App\Repositories;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Query\Builder;
use Illuminate\Support\Facades\DB;

class VendorRepository
{
    /**
     * @return LengthAwarePaginator<int, object>
     */
    public function paginate(string $search = '', int $perPage = 20): LengthAwarePaginator
    {
        $search = trim($search);

        return DB::table('vendtable as vendor')
            ->select($this->columns())
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->when($search !== '', function (Builder $query) use ($search): void {
                $like = '%'.$search.'%';

                $query->where(function (Builder $query) use ($like): void {
                    $query->where('vendor.vendaccount', 'like', $like)
                        ->orWhere('vendor.name', 'like', $like)
                        ->orWhere('vendor.contact_person', 'like', $like)
                        ->orWhere('vendor.phone', 'like', $like)
                        ->orWhere('vendor.email', 'like', $like)
                        ->orWhere('vendor.address', 'like', $like);
                });
            })
            ->orderBy('vendor.name')
            ->orderBy('vendor.vendaccount')
            ->paginate($perPage);
    }

    public function find(string $account): ?object
    {
        return DB::table('vendtable as vendor')
            ->select($this->columns())
            ->selectSub($this->inspectionCountQuery(), 'inspection_count')
            ->where('vendor.vendaccount', $account)
            ->first();
    }

    public function exists(string $account): bool
    {
        return DB::table('vendtable')->where('vendaccount', $account)->exists();
    }

    public function isUsed(string $account): bool
    {
        return DB::table('inspecttable')->where('accountnum', $account)->exists();
    }

    /**
     * @param  array{vendaccount: string, name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}  $data
     */
    public function create(array $data): void
    {
        DB::table('vendtable')->insert($data);
    }

    /**
     * @param  array{name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}  $data
     */
    public function update(string $account, array $data): void
    {
        DB::table('vendtable')->where('vendaccount', $account)->update($data);
    }

    public function delete(string $account): int
    {
        return DB::table('vendtable')->where('vendaccount', $account)->delete();
    }

    /**
     * @param  list<array{vendaccount: string, name: string, contact_person?: string|null, phone?: string|null, email?: string|null, address?: string|null, joined_at?: string|null}>  $rows
     */
    public function upsert(array $rows): void
    {
        foreach ($rows as $row) {
            $account = $row['vendaccount'];
            $data = $row;
            unset($data['vendaccount']);

            if ($this->exists($account)) {
                $updates = array_filter(
                    $data,
                    fn (mixed $value): bool => $value !== null,
                );

                if ($updates !== []) {
                    DB::table('vendtable')->where('vendaccount', $account)->update($updates);
                }

                continue;
            }

            DB::table('vendtable')->insert([
                'vendaccount' => $account,
                'name' => $data['name'] ?? null,
                'contact_person' => $data['contact_person'] ?? null,
                'phone' => $data['phone'] ?? null,
                'email' => $data['email'] ?? null,
                'address' => $data['address'] ?? null,
                'joined_at' => $data['joined_at'] ?? null,
            ]);
        }
    }

    /**
     * @return list<string>
     */
    private function columns(): array
    {
        return [
            'vendor.vendaccount',
            'vendor.name',
            'vendor.contact_person',
            'vendor.phone',
            'vendor.email',
            'vendor.address',
            'vendor.joined_at',
        ];
    }

    private function inspectionCountQuery(): Builder
    {
        return DB::table('inspecttable as inspection')
            ->selectRaw('count(*)')
            ->whereColumn('inspection.accountnum', 'vendor.vendaccount');
    }
}
