<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

class ModuleController extends Controller
{
    public function inspections(): View
    {
        return $this->placeholder(
            'Inspection Form',
            'Create and review incoming inspection forms against Form 7.4.3-F1.',
            'clipboard-check',
        );
    }

    public function aql(): View
    {
        return $this->placeholder(
            'AQL Table',
            'Sampling plans, lot ranges and acceptance numbers for every inspection category.',
            'table',
        );
    }

    public function vendors(): View
    {
        return $this->placeholder(
            'Vendor',
            'Supplier master data, lookup and CSV import.',
            'building',
        );
    }

    public function reports(): View
    {
        return $this->placeholder(
            'Reports',
            'Inspection reports, approval status and PDF printing.',
            'reports',
        );
    }

    public function help(): View
    {
        return view('help.index');
    }

    private function placeholder(string $title, string $description, string $icon): View
    {
        return view('placeholders.module', [
            'title' => $title,
            'description' => $description,
            'icon' => $icon,
        ]);
    }
}
