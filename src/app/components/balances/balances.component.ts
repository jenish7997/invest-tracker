import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Investor } from '../../models';
import { InvestmentService } from '../../services/investment.service';

@Component({
  selector: 'app-balances',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './balances.component.html',
  styleUrls: ['./balances.component.css']
})
export class BalancesComponent implements OnInit {
  investors: Investor[] = [];
  rows: any[] = [];
  form!: FormGroup;

  constructor(private fb: FormBuilder, public svc: InvestmentService) {
    this.svc.listInvestors().subscribe(inv => this.investors = inv);
  }

  ngOnInit() {
    this.form = this.fb.group({
      investorId: ['', Validators.required],
      startMonthKey: [''],
      endMonthKey: [''],
    });
  }

  async run() {
    if (this.form.invalid) return;

    const v = this.form.value;
    const investor = this.investors.find(x => x.id === v.investorId);
    if (!investor) {
      this.rows = [];
      return;
    }

    this.rows = await this.svc.computeBalances(
      investor.id!,
      investor.name,
      v.startMonthKey || undefined,
      v.endMonthKey || undefined
    );
  }
}
