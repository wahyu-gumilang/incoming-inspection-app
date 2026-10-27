<?php

namespace Tests\Feature;

use Tests\TestCase;

class ItemsPageTest extends TestCase
{
    public function test_items_page_lists_legacy_items(): void
    {
        $response = $this->get('/items');

        $response->assertOk();
        $response->assertSee('000-228');
        $response->assertSee('Handle Rhino Prima');
    }
}
