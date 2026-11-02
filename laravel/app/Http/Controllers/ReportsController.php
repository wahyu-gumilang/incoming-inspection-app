<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\InspectionRepository;
use Illuminate\Http\Request;
use Illuminate\View\View;

class ReportsController extends Controller
{
    public function index(Request $request, InspectionRepository $repository): View
    {
        $search = is_string($request->query('search')) ? $request->query('search') : '';

        return view('reports.index', [
            'inspections' => $repository->paginate($search, 20),
            'search' => $search,
        ]);
    }

    public function show(string $inspectnum, InspectionRepository $repository): View
    {
        $inspection = $repository->find($inspectnum);

        abort_if($inspection === null, 404);

        return view('reports.show', [
            'inspection' => $inspection,
            'stdLines' => $repository->lines($inspectnum),
            'otherLines' => $repository->otherLines($inspectnum),
            'plan' => $repository->plan($inspection->aqlplanid !== null ? (int) $inspection->aqlplanid : null),
        ]);
    }
}
