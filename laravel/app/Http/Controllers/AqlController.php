<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Repositories\InspectionRepository;
use Illuminate\View\View;

class AqlController extends Controller
{
    public function index(): View
    {
        return view('aql.index');
    }

    public function edit(string $inspectnum, InspectionRepository $repository): View
    {
        abort_if($repository->find($inspectnum) === null, 404);

        return view('aql.edit', [
            'inspectnum' => $inspectnum,
        ]);
    }
}
