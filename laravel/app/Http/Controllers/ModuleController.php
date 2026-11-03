<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

class ModuleController extends Controller
{
    public function help(): View
    {
        return view('help.index');
    }
}
