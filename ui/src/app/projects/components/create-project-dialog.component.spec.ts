import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreateProjectDialogComponent } from './create-project-dialog.component';
import { Project, ProjectsService } from '../services/projects.service';
import { of, throwError, delay } from 'rxjs';
import { A11yModule } from '@angular/cdk/a11y';
import { TranslateModule } from '@ngx-translate/core';

const createMockProject = (overrides?: Partial<Project>): Project => ({
  id: '1',
  name: 'Test Project',
  description: undefined,
  createdAt: new Date(),
  createdBy: 'test-user',
  lastUpdatedAt: new Date(),
  lastUpdatedBy: 'test-user',
  ...overrides,
});

describe('CreateProjectDialogComponent', () => {
  let component: CreateProjectDialogComponent;
  let fixture: ComponentFixture<CreateProjectDialogComponent>;
  let mockProjectsService: jasmine.SpyObj<ProjectsService>;

  beforeEach(async () => {
    mockProjectsService = jasmine.createSpyObj('ProjectsService', ['createProject']);

    await TestBed.configureTestingModule({
      imports: [CreateProjectDialogComponent, A11yModule, TranslateModule.forRoot()],
      providers: [{ provide: ProjectsService, useValue: mockProjectsService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateProjectDialogComponent);
    component = fixture.componentInstance;
  });

  describe('Focus management', () => {
    it('should auto-focus the name input when dialog opens', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      setTimeout(() => {
        const nameInput = fixture.nativeElement.querySelector('#project-name');
        expect(document.activeElement).toBe(nameInput);
        done();
      }, 100);
    });
  });

  describe('Keyboard interactions', () => {
    it('should close dialog when Escape key is pressed', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      spyOn(component, 'closeDialog');

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' });
      dialogBackdrop.dispatchEvent(escapeEvent);

      expect(component.closeDialog).toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should validate required name and max lengths', () => {
      expect(component.projectForm.valid).toBe(false);
      expect(component.projectForm.get('name')?.errors?.['required']).toBe(true);

      component.projectForm.patchValue({ name: 'Test Project' });
      expect(component.projectForm.valid).toBe(true);

      const longName = 'a'.repeat(101);
      component.projectForm.patchValue({ name: longName });
      expect(component.projectForm.get('name')?.errors?.['maxlength']).toBeTruthy();

      const longDescription = 'a'.repeat(501);
      component.projectForm.patchValue({ name: 'Test', description: longDescription });
      expect(component.projectForm.get('description')?.errors?.['maxlength']).toBeTruthy();
    });
  });

  describe('Form submission', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should not submit when form is invalid', () => {
      component.onSubmit();
      expect(mockProjectsService.createProject).not.toHaveBeenCalled();
    });

    it('should submit valid form data', () => {
      mockProjectsService.createProject.and.returnValue(of(createMockProject()));

      component.projectForm.patchValue({ name: 'Test Project' });
      component.onSubmit();

      expect(mockProjectsService.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: undefined,
      });
    });

    it('should manage loading state during submission', (done) => {
      mockProjectsService.createProject.and.returnValue(of(createMockProject()).pipe(delay(10)));

      component.projectForm.patchValue({ name: 'Test Project' });
      expect(component.isLoading()).toBe(false);

      component.onSubmit();
      expect(component.isLoading()).toBe(true);

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        done();
      }, 50);
    });

    it('should reset form and close dialog on successful submission', (done) => {
      mockProjectsService.createProject.and.returnValue(of(createMockProject()));

      spyOn(component.projectCreated, 'emit');
      spyOn(component, 'closeDialog');

      component.projectForm.patchValue({ name: 'Test Project' });
      component.onSubmit();

      setTimeout(() => {
        expect(component.projectCreated.emit).toHaveBeenCalled();
        expect(component.closeDialog).toHaveBeenCalled();
        done();
      }, 100);
    });

    it('should display error message on submission failure', (done) => {
      const errorMessage = 'Failed to create project';
      mockProjectsService.createProject.and.returnValue(throwError(() => new Error(errorMessage)));

      component.projectForm.patchValue({ name: 'Test Project' });
      component.onSubmit();

      setTimeout(() => {
        expect(component.isLoading()).toBe(false);
        expect(component.errorMessage()).toBe(errorMessage);
        done();
      }, 100);
    });
  });

  describe('Dialog actions', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should close dialog and reset form state', () => {
      component.projectForm.patchValue({ name: 'Test Project', description: 'Test Description' });
      component.errorMessage.set('Some error');

      spyOn(component.dialogClosed, 'emit');
      component.closeDialog();

      expect(component.projectForm.value).toEqual({ name: null, description: null });
      expect(component.errorMessage()).toBeNull();
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });

    it('should close dialog when clicking on backdrop but not on content', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const dialogContent = fixture.nativeElement.querySelector('.dialog-content');

      const backdropClickEvent = new MouseEvent('click');
      Object.defineProperty(backdropClickEvent, 'target', { value: backdrop, enumerable: true });
      Object.defineProperty(backdropClickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });
      component.onBackdropClick(backdropClickEvent);
      expect(component.closeDialog).toHaveBeenCalled();

      (component.closeDialog as jasmine.Spy).calls.reset();

      const contentClickEvent = new MouseEvent('click');
      Object.defineProperty(contentClickEvent, 'target', {
        value: dialogContent,
        enumerable: true,
      });
      Object.defineProperty(contentClickEvent, 'currentTarget', {
        value: backdrop,
        enumerable: true,
      });
      component.onBackdropClick(contentClickEvent);
      expect(component.closeDialog).not.toHaveBeenCalled();
    });
  });
});
