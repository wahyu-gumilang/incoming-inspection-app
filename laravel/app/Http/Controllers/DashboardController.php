<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\InspectionRepository;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(InspectionRepository $inspections): View
    {
        return view('dashboard', [
            'itemCount' => DB::table('inventtable')->count(),
            'standardCount' => DB::table('inventinspectitem')->count(),
            'vendorCount' => DB::table('vendtable')->count(),
            'userCount' => DB::table('usertable')->where('active', 1)->count(),
            'statusCounts' => $inspections->statusCounts(),
            'recentInspections' => $inspections->recent(6),
        ]);
    }
}
