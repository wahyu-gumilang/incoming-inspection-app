<?php

namespace Tests\Unit;

use App\Domain\User\Role;
use PHPUnit\Framework\TestCase;

class RoleTest extends TestCase
{
    public function test_all_roles_are_listed(): void
    {
        $this->assertSame(['INSPECTOR', 'CHECKER', 'ADMIN'], Role::all());
    }

    public function test_labels_are_human_readable(): void
    {
        $this->assertSame('Inspector', Role::label(Role::INSPECTOR));
        $this->assertSame('Checker', Role::label(Role::CHECKER));
        $this->assertSame('Admin', Role::label(Role::ADMIN));
        $this->assertSame('UNKNOWN', Role::label('UNKNOWN'));
    }
}
