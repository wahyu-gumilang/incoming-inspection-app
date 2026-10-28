<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AvatarController extends Controller
{
    public function show(string $filename): StreamedResponse
    {
        if (preg_match('/^[A-Za-z0-9._-]+$/', $filename) !== 1) {
            abort(404);
        }

        $path = 'avatars/'.$filename;

        if (! Storage::disk('public')->exists($path)) {
            abort(404);
        }

        return Storage::disk('public')->response($path);
    }
}
