import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '../navbar/navbar';

// Every page after sign-in: the top navbar and the page area below it.
@Component({
  selector: 'app-shell',
  imports: [Navbar, RouterOutlet],
  templateUrl: './app-shell.html',
  styleUrl: './app-shell.scss',
})
export class AppShell {}
