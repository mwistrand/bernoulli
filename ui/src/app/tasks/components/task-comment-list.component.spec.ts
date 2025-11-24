import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TaskCommentListComponent } from './task-comment-list.component';
import { TasksService, TaskComment } from '../services/tasks.service';
import { AuthService, User, UserRole } from '../../auth/services/auth.service';
import { signal } from '@angular/core';

describe('TaskCommentListComponent', () => {
  let component: TaskCommentListComponent;
  let fixture: ComponentFixture<TaskCommentListComponent>;
  let tasksService: jasmine.SpyObj<TasksService>;
  let authService: jasmine.SpyObj<AuthService>;
  let translateService: jasmine.SpyObj<TranslateService>;

  const mockUser: User = {
    id: 'user-123',
    name: 'Test User',
    email: 'test@example.com',
    role: UserRole.USER,
  };

  const mockComments: TaskComment[] = [
    {
      id: 'comment-1',
      taskId: 'task-123',
      comment: 'First comment',
      createdAt: new Date('2024-01-01T10:00:00Z'),
      createdBy: 'user-123',
      createdByName: 'Oscar Peterson',
      lastUpdatedAt: new Date('2024-01-01T10:00:00Z'),
      lastUpdatedBy: 'user-123',
      lastUpdatedByName: 'Oscar Peterson',
    },
    {
      id: 'comment-2',
      taskId: 'task-123',
      comment: '# Markdown comment\n\nWith **bold** text',
      createdAt: new Date('2024-01-02T10:00:00Z'),
      createdBy: 'user-456',
      createdByName: 'Makoto Ozone',
      lastUpdatedAt: new Date('2024-01-02T12:00:00Z'),
      lastUpdatedBy: 'user-456',
      lastUpdatedByName: 'Makoto Ozone',
    },
  ];

  beforeEach(async () => {
    const mockTasksService = jasmine.createSpyObj('TasksService', [
      'findCommentsByTaskId',
      'fetchCommentsByTaskId',
      'updateTaskComment',
      'deleteTaskComment',
    ]);

    const mockAuthService = {
      currentUser: signal<User | null>(mockUser),
    };

    await TestBed.configureTestingModule({
      imports: [TaskCommentListComponent, TranslateModule.forRoot()],
      providers: [
        { provide: TasksService, useValue: mockTasksService },
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compileComponents();

    tasksService = TestBed.inject(TasksService) as jasmine.SpyObj<TasksService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;

    fixture = TestBed.createComponent(TaskCommentListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch comments on init', () => {
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    expect(tasksService.fetchCommentsByTaskId).toHaveBeenCalledWith('project-123', 'task-123');
  });

  it('should display comments', () => {
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const commentItems = compiled.querySelectorAll('.comment-item');
    expect(commentItems.length).toBe(2);
  });

  it('should display "no comments" message when empty', () => {
    tasksService.findCommentsByTaskId.and.returnValue([]);
    tasksService.fetchCommentsByTaskId.and.returnValue(of([]));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const noComments = compiled.querySelector('.no-comments');
    expect(noComments).toBeTruthy();
  });

  it('should show edit indicator for edited comments', () => {
    const editedComment = { ...mockComments[1] };
    expect(component.isEdited(editedComment)).toBe(true);
  });

  it('should not show edit indicator for unedited comments', () => {
    const uneditedComment = { ...mockComments[0] };
    expect(component.isEdited(uneditedComment)).toBe(false);
  });

  it('should allow current user to edit their own comments', () => {
    const ownComment = mockComments[0];
    expect(component.canEditOrDelete(ownComment)).toBe(true);
  });

  it('should not allow current user to edit other users comments', () => {
    const otherComment = mockComments[1];
    expect(component.canEditOrDelete(otherComment)).toBe(false);
  });

  it('should render markdown in comments', () => {
    const markdown = '# Heading\n\n**Bold text**';
    const rendered = component.renderMarkdown(markdown);
    expect(rendered).toBeTruthy();
  });

  it('should start edit mode', () => {
    const comment = mockComments[0];
    component.startEdit(comment);

    expect(component.editingCommentId()).toBe('comment-1');
    expect(component.editingCommentText()).toBe('First comment');
  });

  it('should cancel edit mode', () => {
    component.startEdit(mockComments[0]);
    component.cancelEdit();

    expect(component.editingCommentId()).toBeNull();
    expect(component.editingCommentText()).toBe('');
    expect(component.errorMessage()).toBeNull();
  });

  it('should submit edit successfully', () => {
    const updatedComment = { ...mockComments[0], comment: 'Updated comment' };
    tasksService.updateTaskComment.and.returnValue(of(updatedComment));
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.startEdit(mockComments[0]);
    component.editingCommentText.set('Updated comment');
    component.submitEdit('comment-1');

    expect(tasksService.updateTaskComment).toHaveBeenCalledWith(
      'project-123',
      'task-123',
      'comment-1',
      {
        comment: 'Updated comment',
      },
    );
    expect(component.editingCommentId()).toBeNull();
  });

  it('should show error when editing with blank comment', () => {
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.startEdit(mockComments[0]);
    component.editingCommentText.set('   ');
    component.submitEdit('comment-1');

    expect(component.errorMessage()).toBeTruthy();
    expect(tasksService.updateTaskComment).not.toHaveBeenCalled();
  });

  it('should handle edit error', () => {
    tasksService.updateTaskComment.and.returnValue(throwError(() => new Error('Update failed')));
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.startEdit(mockComments[0]);
    component.editingCommentText.set('Updated comment');
    component.submitEdit('comment-1');

    expect(component.errorMessage()).toBeTruthy();
    expect(component.isSubmitting()).toBe(false);
  });

  it('should delete comment after confirmation', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    tasksService.deleteTaskComment.and.returnValue(of(undefined));
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.deleteComment(mockComments[0]);

    expect(tasksService.deleteTaskComment).toHaveBeenCalledWith(
      'project-123',
      'task-123',
      'comment-1',
    );
  });

  it('should not delete comment when cancelled', () => {
    spyOn(window, 'confirm').and.returnValue(false);
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.deleteComment(mockComments[0]);

    expect(tasksService.deleteTaskComment).not.toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    tasksService.deleteTaskComment.and.returnValue(throwError(() => new Error('Delete failed')));
    tasksService.findCommentsByTaskId.and.returnValue(mockComments);
    tasksService.fetchCommentsByTaskId.and.returnValue(of(mockComments));

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    component.deleteComment(mockComments[0]);

    expect(component.errorMessage()).toBeTruthy();
  });

  it('should handle fetch comments error', () => {
    tasksService.fetchCommentsByTaskId.and.returnValue(throwError(() => new Error('Fetch failed')));
    tasksService.findCommentsByTaskId.and.returnValue([]);

    fixture.componentRef.setInput('projectId', 'project-123');
    fixture.componentRef.setInput('taskId', 'task-123');
    fixture.detectChanges();

    expect(component.errorMessage()).toBeTruthy();
  });
});
