<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\View\View;

class ItemsController extends Controller
{
    public function index(): View
    {
        return view('items.index');
    }

    public function show(string $itemid): View
    {
        return view('items.show', [
            'itemid' => $itemid,
        ]);
    }
}
