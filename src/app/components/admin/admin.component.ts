import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { InvestmentService } from '../../services/investment.service';
import { AuthService } from '../../services/auth.service';
import { Investor, Transaction } from '../../models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  investors: Investor[] = [];
  transactions: Transaction[] = [];

  constructor(
    private svc: InvestmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Check authentication
    if (!this.authService.isAuthenticated()) {
      this.authService.requireAuth();
      return;
    }

    // Fetch all investors
    this.svc.listInvestors().subscribe(data => {
      this.investors = data;
    });

    // Note: You need to implement listTransactions() method in InvestmentService
    // that gets all transactions from all investors, or modify this logic
  }

  onLogout(): void {
    this.authService.logout();
  }
}