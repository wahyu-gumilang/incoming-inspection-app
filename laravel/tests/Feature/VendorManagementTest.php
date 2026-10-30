<?php

declare(strict_types=1);

namespace Tests\Feature;

use App\Domain\User\Role;
use App\Livewire\Vendors\VendorManager;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Livewire\Livewire;
use Tests\TestCase;

class VendorManagementTest extends TestCase
{
    use DatabaseTransactions;

    public function test_vendors_page_lists_supplier_master_data(): void
    {
        $user = $this->makeUser();

        $this->actingAs($user)
            ->get('/vendors')
            ->assertOk()
            ->assertSee('V-0001')
            ->assertSee('PT Sinar Logam Abadi');
    }

    public function test_checker_can_create_a_vendor(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(VendorManager::class)
            ->call('openCreate')
            ->assertSet('showCreate', true)
            ->set('account', 'V-9001')
            ->set('name', 'PT Vendor Baru')
            ->call('createVendor')
            ->assertHasNoErrors()
            ->assertSet('showCreate', false)
            ->assertSet('statusMessage', 'Vendor added.');

        $this->assertDatabaseHas('vendtable', [
            'vendaccount' => 'V-9001',
            'name' => 'PT Vendor Baru',
        ]);
    }

    public function test_checker_can_rename_a_vendor(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        Livewire::actingAs($checker)
            ->test(VendorManager::class)
            ->call('openEdit', 'V-0001')
            ->assertSet('editingAccount', 'V-0001')
            ->set('name', 'PT Sinar Logam Abadi Updated')
            ->call('saveEdit')
            ->assertHasNoErrors()
            ->assertSet('showEdit', false)
            ->assertSet('statusMessage', 'Vendor name updated.');

        $this->assertDatabaseHas('vendtable', [
            'vendaccount' => 'V-0001',
            'name' => 'PT Sinar Logam Abadi Updated',
        ]);
    }

    public function test_vendor_used_by_an_inspection_cannot_be_deleted(): void
    {
        $admin = $this->makeUser(['role' => Role::ADMIN]);

        DB::table('inspecttable')->insert([
            'inspectnum' => 'INS-VENDOR-001',
            'accountnum' => 'V-0001',
        ]);

        Livewire::actingAs($admin)
            ->test(VendorManager::class)
            ->call('confirmDelete', 'V-0001')
            ->assertSet('showDelete', false)
            ->assertSet('errorMessage', 'This vendor is used by an inspection and cannot be deleted.');

        $this->assertDatabaseHas('vendtable', ['vendaccount' => 'V-0001']);
    }

    public function test_checker_can_delete_an_unused_vendor(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);

        DB::table('vendtable')->insert([
            'vendaccount' => 'V-9002',
            'name' => 'PT Unused Vendor',
        ]);

        Livewire::actingAs($checker)
            ->test(VendorManager::class)
            ->call('confirmDelete', 'V-9002')
            ->assertSet('showDelete', true)
            ->call('deleteVendor')
            ->assertSet('showDelete', false)
            ->assertSet('statusMessage', 'Vendor deleted.');

        $this->assertDatabaseMissing('vendtable', ['vendaccount' => 'V-9002']);
    }

    public function test_checker_can_import_vendors_from_csv(): void
    {
        $checker = $this->makeUser(['role' => Role::CHECKER]);
        $file = UploadedFile::fake()->createWithContent(
            'vendors.csv',
            "vendaccount,name\nV-9101,PT Import Satu\nV-9102,PT Import Dua\n",
        );

        Livewire::actingAs($checker)
            ->test(VendorManager::class)
            ->call('openImport')
            ->set('csvFile', $file)
            ->assertSet('importParsed', true)
            ->assertSet('importErrors', [])
            ->call('importVendors')
            ->assertHasNoErrors()
            ->assertSet('showImport', false);

        $this->assertDatabaseHas('vendtable', [
            'vendaccount' => 'V-9101',
            'name' => 'PT Import Satu',
        ]);
        $this->assertDatabaseHas('vendtable', [
            'vendaccount' => 'V-9102',
            'name' => 'PT Import Dua',
        ]);
    }

    public function test_inspector_does_not_see_vendor_management_actions(): void
    {
        $inspector = $this->makeUser();

        $this->actingAs($inspector)
            ->get('/vendors')
            ->assertOk()
            ->assertDontSee('Add vendor')
            ->assertDontSee('Import CSV')
            ->assertDontSee('openCreate')
            ->assertDontSee('openEdit');
    }
}
