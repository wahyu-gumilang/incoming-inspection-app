<?php

namespace App\Http\Controllers;

use Illuminate\Contracts\View\View;

class UiKitController extends Controller
{
    public function index(): View
    {
        return view('ui-kit.index');
    }
}
