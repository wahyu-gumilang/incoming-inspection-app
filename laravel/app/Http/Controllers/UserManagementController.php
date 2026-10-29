<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

class UserManagementController extends Controller
{
    public function index(): View
    {
        return view('users.index');
    }
}
