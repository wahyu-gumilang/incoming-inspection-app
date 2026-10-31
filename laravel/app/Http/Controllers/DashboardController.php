<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(): View
    {
        return view('dashboard', [
            'itemCount' => DB::table('inventtable')->count(),
            'standardCount' => DB::table('inventinspectitem')->count(),
            'inspectionCount' => DB::table('inspecttable')->count(),
            'userCount' => DB::table('usertable')->where('active', 1)->count(),
        ]);
    }
}
