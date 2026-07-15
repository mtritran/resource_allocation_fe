import React, { useEffect, useState } from 'react';
import { api, Project, ProjectPage } from '../services/api';
import { Plus, Search, Edit2, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight } from 'lucide-react';

export const Projects: React.FC = () => {
  const [projectsPage, setProjectsPage] = useState<ProjectPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Project>({
    projectCode: '',
    projectName: '',
    customer: '',
    startDate: '',
    endDate: '',
    status: 'PLANNING',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getProjects({
        status: statusFilter || undefined,
        page,
        size,
      });
      setProjectsPage(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, statusFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      projectCode: '',
      projectName: '',
      customer: '',
      startDate: '',
      endDate: '',
      status: 'PLANNING',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (proj: Project) => {
    setModalMode('edit');
    setFormData({
      projectCode: proj.projectCode,
      projectName: proj.projectName,
      customer: proj.customer || '',
      startDate: proj.startDate || '',
      endDate: proj.endDate || '',
      status: proj.status,
    });
    setEditingId(proj.projectId || null);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Basic Validation: EndDate >= StartDate
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setFormError('End date must be on or after start date');
      return;
    }

    try {
      // Clean dates to null if empty
      const projectPayload: Project = {
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      if (modalMode === 'create') {
        await api.createProject(projectPayload);
      } else if (modalMode === 'edit' && editingId !== null) {
        await api.updateProject(editingId, projectPayload);
      }
      setShowModal(false);
      fetchProjects();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save project');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this project?')) return;
    try {
      await api.deleteProject(id);
      fetchProjects();
    } catch (err: any) {
      alert(err.message || 'Failed to delete project');
    }
  };

  const displayedProjects = projectsPage?.content.filter(proj => 
    proj.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    proj.projectCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (proj.customer && proj.customer.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PLANNING': return 'badge-planning';
      case 'ACTIVE': return 'badge-active';
      case 'COMPLETED': return 'badge-completed';
      default: return '';
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects Portfolio</h1>
          <p className="page-subtitle">Track project timeline execution schedules and status states.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Create Project
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control form-control-search"
            placeholder="Search by code, title or customer..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <select
          className="form-control filter-select"
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Statuses</option>
          <option value="PLANNING">PLANNING</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="COMPLETED">COMPLETED</option>
        </select>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="spinner-container">
          <Loader2 className="spinner" />
          <span style={{ marginLeft: '1rem' }}>Loading Projects...</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" style={{ color: 'var(--color-danger)' }} />
          <div className="empty-state-title">Error Loading Projects</div>
          <p>{error}</p>
        </div>
      ) : displayedProjects.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <div className="empty-state-title">No Projects Found</div>
          <p>Try modifying your filters or create a new project definition.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Project Name</th>
                  <th>Customer</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedProjects.map(proj => (
                  <tr key={proj.projectId}>
                    <td style={{ fontWeight: 600 }}>{proj.projectCode}</td>
                    <td>{proj.projectName}</td>
                    <td>{proj.customer || '—'}</td>
                    <td>{proj.startDate || '—'}</td>
                    <td>{proj.endDate || '—'}</td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(proj.status)}`}>
                        {proj.status}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit"
                          onClick={() => handleOpenEdit(proj)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(proj.projectId!)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {projectsPage && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {page * size + 1} to {Math.min((page + 1) * size, projectsPage.totalElements)} of {projectsPage.totalElements} records
              </span>
              <div className="pagination-controls">
                <button
                  className="btn btn-secondary btn-icon"
                  disabled={page === 0}
                  onClick={() => setPage(page - 1)}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  className="btn btn-secondary btn-icon"
                  disabled={(page + 1) * size >= projectsPage.totalElements}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* CRUD Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{modalMode === 'create' ? 'Create New Project' : 'Edit Project'}</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                {formError && (
                  <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem', background: 'var(--color-danger-bg)', border: '1px solid rgba(244, 63, 94, 0.15)', borderRadius: 'var(--border-radius-md)', color: 'var(--color-danger)', fontSize: '0.9rem', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ flexShrink: 0 }} />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="form-group">
                  <label>Project Code *</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    className="form-control"
                    placeholder="e.g. NCG"
                    value={formData.projectCode}
                    onChange={e => setFormData({ ...formData, projectCode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Project Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. New Core Gateway"
                    value={formData.projectName}
                    onChange={e => setFormData({ ...formData, projectName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Customer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. ABC Corp"
                    value={formData.customer}
                    onChange={e => setFormData({ ...formData, customer: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.startDate}
                      onChange={e => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>End Date</label>
                    <input
                      type="date"
                      className="form-control"
                      value={formData.endDate}
                      onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Project Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="PLANNING">PLANNING</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="COMPLETED">COMPLETED</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
