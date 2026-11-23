<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Domain\Inspection\InspectionStatus;
use App\Repositories\InspectionRepository;
use Dompdf\Dompdf;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\View\View;

class ReportsController extends Controller
{
    public function index(Request $request, InspectionRepository $repository): View
    {
        $search = is_string($request->query('search')) ? $request->query('search') : '';
        $statusRaw = $request->query('status');
        $status = is_string($statusRaw) ? strtoupper(trim($statusRaw)) : '';
        $status = in_array($status, InspectionStatus::all(), true) ? $status : '';

        $statusOptions = [
            '' => 'All statuses',
            InspectionStatus::DRAFT => 'Draft',
            InspectionStatus::SUBMITTED => 'Submitted',
            InspectionStatus::CHECKED => 'Checked',
            InspectionStatus::RETURNED => 'Returned',
        ];
        $statusLinks = [];

        foreach (array_keys($statusOptions) as $value) {
            $params = [];

            if ($search !== '') {
                $params['search'] = $search;
            }

            if ($value !== '') {
                $params['status'] = $value;
            }

            $statusLinks[$value] = route('reports.index', $params);
        }

        return view('reports.index', [
            'inspections' => $repository->paginate($search, 20, $status !== '' ? $status : null),
            'search' => $search,
            'status' => $status,
            'statusOptions' => $statusOptions,
            'statusLinks' => $statusLinks,
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

    public function pdf(string $inspectnum, InspectionRepository $repository): Response
    {
        $inspection = $repository->find($inspectnum);

        abort_if($inspection === null, 404);

        abort_unless(
            InspectionStatus::normalize($inspection->inspectstatus) === InspectionStatus::CHECKED,
            403,
            'Only checked inspections can be downloaded as PDF.',
        );

        $dompdf = new Dompdf;
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->loadHtml(view('reports.pdf', [
            'inspection' => $inspection,
            'stdLines' => $repository->lines($inspectnum),
            'otherLines' => $repository->otherLines($inspectnum),
            'plan' => $repository->plan($inspection->aqlplanid !== null ? (int) $inspection->aqlplanid : null),
        ])->render(), 'UTF-8');
        $dompdf->render();

        return response($dompdf->output(), 200, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'attachment; filename="'.$inspectnum.'.pdf"',
        ]);
    }
}
