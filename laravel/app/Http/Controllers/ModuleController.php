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
