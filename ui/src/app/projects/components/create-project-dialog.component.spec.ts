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

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Dialog visibility', () => {
    it('should not render dialog when isOpen is false', () => {
      fixture.componentRef.setInput('isOpen', false);
      fixture.detectChanges();

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      expect(dialogBackdrop).toBeNull();
    });

    it('should render dialog when isOpen is true', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      expect(dialogBackdrop).not.toBeNull();
    });
  });

  describe('Focus management', () => {
    it('should auto-focus the name input when dialog opens', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      // Wait for focus trap to activate
      setTimeout(() => {
        const nameInput = fixture.nativeElement.querySelector('#project-name');
        expect(document.activeElement).toBe(nameInput);
        done();
      }, 100);
    });

    it('should trap focus within the dialog', (done) => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      setTimeout(() => {
        const dialogContent = fixture.nativeElement.querySelector('.dialog-content');
        const nameInput = fixture.nativeElement.querySelector('#project-name');

        // Focus should start on name input due to cdkFocusInitial
        expect(document.activeElement).toBe(nameInput);

        // Verify all focusable elements are within the dialog content
        const allFocusableElements = dialogContent.querySelectorAll('button, input, textarea');
        expect(allFocusableElements.length).toBeGreaterThan(0);

        allFocusableElements.forEach((element: Element) => {
          expect(dialogContent.contains(element)).toBe(true);
        });

        // Verify cdkTrapFocus directive is applied
        const trapFocusElement = fixture.nativeElement.querySelector('[cdkTrapFocus]');
        expect(trapFocusElement).toBe(dialogContent);

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

    it('should not close dialog when other keys are pressed', () => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();

      spyOn(component, 'closeDialog');

      const dialogBackdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const enterEvent = new KeyboardEvent('keydown', { key: 'Enter' });
      dialogBackdrop.dispatchEvent(enterEvent);

      expect(component.closeDialog).not.toHaveBeenCalled();
    });
  });

  describe('Form validation', () => {
    beforeEach(() => {
      fixture.componentRef.setInput('isOpen', true);
      fixture.detectChanges();
    });

    it('should have invalid form when name is empty', () => {
      expect(component.projectForm.valid).toBe(false);
      expect(component.projectForm.get('name')?.errors?.['required']).toBe(true);
    });

    it('should have valid form when name is provided', () => {
      component.projectForm.patchValue({ name: 'Test Project' });
      expect(component.projectForm.valid).toBe(true);
    });

    it('should validate name max length', () => {
      const longName = 'a'.repeat(101);
      component.projectForm.patchValue({ name: longName });
      expect(component.projectForm.get('name')?.errors?.['maxlength']).toBeTruthy();
    });

    it('should validate description max length', () => {
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

    it('should submit when form is valid', () => {
      mockProjectsService.createProject.and.returnValue(of(createMockProject()));

      component.projectForm.patchValue({ name: 'Test Project' });
      component.onSubmit();

      expect(mockProjectsService.createProject).toHaveBeenCalledWith({
        name: 'Test Project',
        description: undefined,
      });
    });

    it('should set loading state during submission', (done) => {
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
        expect(component.isLoading()).toBe(false);
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

    it('should close dialog and reset form when closeDialog is called', () => {
      component.projectForm.patchValue({ name: 'Test Project', description: 'Test Description' });
      component.errorMessage.set('Some error');

      spyOn(component.dialogClosed, 'emit');
      component.closeDialog();

      expect(component.projectForm.value).toEqual({ name: null, description: null });
      expect(component.errorMessage()).toBeNull();
      expect(component.dialogClosed.emit).toHaveBeenCalled();
    });

    it('should close dialog when clicking on backdrop', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', { value: backdrop, enumerable: true });
      Object.defineProperty(clickEvent, 'currentTarget', { value: backdrop, enumerable: true });

      component.onBackdropClick(clickEvent);

      expect(component.closeDialog).toHaveBeenCalled();
    });

    it('should not close dialog when clicking on dialog content', () => {
      spyOn(component, 'closeDialog');

      const backdrop = fixture.nativeElement.querySelector('.dialog-backdrop');
      const dialogContent = fixture.nativeElement.querySelector('.dialog-content');
      const clickEvent = new MouseEvent('click');
      Object.defineProperty(clickEvent, 'target', { value: dialogContent, enumerable: true });
      Object.defineProperty(clickEvent, 'currentTarget', { value: backdrop, enumerable: true });

      component.onBackdropClick(clickEvent);

      expect(component.closeDialog).not.toHaveBeenCalled();
    });

    it('should close dialog when clicking close button', () => {
      spyOn(component, 'closeDialog');

      const closeButton = fixture.nativeElement.querySelector('.close-button');
      closeButton.click();

      expect(component.closeDialog).toHaveBeenCalled();
    });
  });
});
