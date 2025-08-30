import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { InvestmentService } from '../../services/investment.service';
import { MonthlyRate } from '../../models';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-interest',
  templateUrl: './interest.component.html',
  styleUrls: ['./interest.component.css'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class InterestComponent implements OnInit {
  rateForm!: FormGroup;
  rates: MonthlyRate[] = [];

  constructor(private fb: FormBuilder, public svc: InvestmentService) { }

  ngOnInit() {
    this.rateForm = this.fb.group({
      monthKey: ['', Validators.required], // ✅ required
      rate: [0, [Validators.required, Validators.min(0)]], // ✅ must be >= 0
    });

    this.svc.listRates().subscribe(r => {
      // optional: sort by month for cleaner table display
      this.rates = r.sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    });
  }


  async saveRate() {
    if (this.rateForm.invalid) return;
    const v = this.rateForm.value;

    await this.svc.setMonthlyRate({
      monthKey: v.monthKey!,
      rate: Number(v.rate),
    });

    // reset only the rate, keep the same month for convenience
    this.rateForm.patchValue({ rate: 0 });
  }
}
