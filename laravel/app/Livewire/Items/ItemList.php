<?php

declare(strict_types=1);

namespace App\Livewire\Items;

use App\Repositories\ItemRepository;
use Illuminate\Contracts\View\View;
use Livewire\Component;

class ItemList extends Component
{
    public string $search = '';

    public function render(): View
    {
        $items = app(ItemRepository::class);

        return view('livewire.items.item-list', [
            'items' => $items->search($this->search),
            'total' => $items->count(),
        ]);
    }
}
