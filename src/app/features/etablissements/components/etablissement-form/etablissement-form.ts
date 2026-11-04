import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { switchMap, of } from 'rxjs';
import { Etablissement, EtablissementPayload } from '../../models/etablissement.model';
import { EtablissementsService } from '../../services/etablissements.service';

@Component({
  selector: 'app-etablissement-form',
  imports: [ReactiveFormsModule],
  templateUrl: './etablissement-form.html',
})
export class EtablissementForm implements OnInit {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly api = inject(EtablissementsService);

  readonly etablissement = input<Etablissement | null>(null);
  readonly saved = output<Etablissement>();
  readonly closed = output<void>();

  readonly submitting = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly logoError = signal<string | null>(null);
  private logoFile: File | null = null;
  private removeExistingLogo = false;

  readonly form = this.fb.group({
    nom: ['', [Validators.required, Validators.maxLength(150)]],
    sigle: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9-]{2,20}$/)]],
    domaineEmail: [
      '',
      [
        Validators.required,
        Validators.pattern(/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i),
      ],
    ],
    description: [''],
    adresse: [''],
    ville: [''],
    telephone: [''],
    emailContact: ['', [Validators.email]],
    siteWeb: ['', [Validators.pattern(/^$|^https?:\/\/.+\..+/)]],
    actif: [true],
  });

  get isEdit() {
    return !!this.etablissement();
  }

  ngOnInit() {
    const e = this.etablissement();
    if (e) {
      this.form.patchValue({
        nom: e.nom,
        sigle: e.sigle,
        domaineEmail: e.domaineEmail,
        description: e.description ?? '',
        adresse: e.adresse ?? '',
        ville: e.ville ?? '',
        telephone: e.telephone ?? '',
        emailContact: e.emailContact ?? '',
        siteWeb: e.siteWeb ?? '',
        actif: e.actif,
      });
      this.logoPreview.set(e.logoUrl);
    }
  }

  onLogoSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    this.logoError.set(null);
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(file.type)) {
      this.logoError.set('Format accepté : PNG, JPG, WEBP ou SVG');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.logoError.set('Le logo ne doit pas dépasser 2 Mo');
      return;
    }
    this.logoFile = file;
    this.removeExistingLogo = false;
    this.logoPreview.set(URL.createObjectURL(file));
  }

  clearLogo() {
    this.logoFile = null;
    this.removeExistingLogo = !!this.etablissement()?.logoUrl;
    this.logoPreview.set(null);
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.errorMessage.set(null);

    const raw = this.form.getRawValue();
    const payload: EtablissementPayload = {
      ...raw,
      sigle: raw.sigle.trim().toUpperCase(),
      domaineEmail: raw.domaineEmail.trim().toLowerCase(),
    };

    const current = this.etablissement();
    const save$ = current ? this.api.update(current.id, payload) : this.api.create(payload);

    save$
      .pipe(
        switchMap((saved) => {
          if (this.logoFile) return this.api.uploadLogo(saved.id, this.logoFile);
          if (this.removeExistingLogo) return this.api.removeLogo(saved.id);
          return of(saved);
        }),
      )
      .subscribe({
        next: (result) => {
          this.submitting.set(false);
          this.saved.emit(result);
        },
        error: (err: HttpErrorResponse) => {
          this.submitting.set(false);
          const msg = err.error?.message;
          this.errorMessage.set(
            Array.isArray(msg) ? msg.join(' · ') : (msg ?? "Une erreur est survenue, réessaie."),
          );
        },
      });
  }

  hasError(name: keyof typeof this.form.controls) {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }
}