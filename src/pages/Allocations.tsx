import React, { useEffect, useState } from 'react';
import { api, Allocation, AllocationPage, Employee, Project } from '../services/api';
import { Plus, Search, Edit2, Trash2, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Check, Power } from 'lucide-react';

export const Allocations: React.FC = () => {
  const [allocationsPage, setAllocationsPage] = useState<AllocationPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  // Dropdown list resources for dropdown selection inside form
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Allocation>({
    employeeId: 0,
    projectId: 0,
    allocationPercent: 50,
    roleInProject: '',
    startDate: '',
    endDate: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getAllocations({
        page,
        size,
      });
      setAllocationsPage(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch allocations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [page]);

  // Load dropdown resources (employees and active projects) when opening the creation/modification modal
  const loadResources = async () => {
    try {
      setLoadingResources(true);
      // Fetch all employees and projects (using high limit page sizes to populate options)
      const [empRes, projRes] = await Promise.all([
        api.getEmployees({ page: 0, size: 100 }),
        api.getProjects({ page: 0, size: 100 }),
      ]);
      setEmployees(empRes.content);
      // Only allocate to PLANNING/ACTIVE projects (spec: can't allocate to COMPLETED)
      setProjects(projRes.content.filter(p => p.status !== 'COMPLETED'));
    } catch (err: any) {
      setFormError('Failed to load employee/project lists');
    } finally {
      setLoadingResources(false);
    }
  };

  const handleOpenCreate = async () => {
    setModalMode('create');
    setFormData({
      employeeId: 0,
      projectId: 0,
      allocationPercent: 50,
      roleInProject: '',
      startDate: '',
      endDate: '',
    });
    setFormError(null);
    setShowModal(true);
    await loadResources();
  };

  const handleOpenEdit = async (alloc: Allocation) => {
    setModalMode('edit');
    setFormData({
      employeeId: alloc.employeeId,
      projectId: alloc.projectId,
      allocationPercent: alloc.allocationPercent,
      roleInProject: alloc.roleInProject || '',
      startDate: alloc.startDate || '',
      endDate: alloc.endDate || '',
    });
    setEditingId(alloc.allocationId || null);
    setFormError(null);
    setShowModal(true);
    await loadResources();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (formData.employeeId === 0) {
      setFormError('Please select an employee');
      return;
    }
    if (formData.projectId === 0) {
      setFormError('Please select a project');
      return;
    }
    if (formData.startDate && formData.endDate && formData.endDate < formData.startDate) {
      setFormError('End date must be on or after start date');
      return;
    }

    try {
      const payload: Allocation = {
        ...formData,
        startDate: formData.startDate || undefined,
        endDate: formData.endDate || undefined,
      };

      if (modalMode === 'create') {
        await api.createAllocation(payload);
      } else if (modalMode === 'edit' && editingId !== null) {
        await api.updateAllocation(editingId, payload);
      }
      setShowModal(false);
      fetchAllocations();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save allocation');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to remove this allocation?')) return;
    try {
      await api.deleteAllocation(id);
      fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Failed to delete allocation');
    }
  };

  const handleActivate = async (id: number) => {
    try {
      await api.activateAllocation(id);
      fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Failed to activate allocation');
    }
  };

  const handleEnd = async (id: number) => {
    if (!window.confirm('Are you sure you want to end this allocation?')) return;
    try {
      await api.endAllocation(id);
      fetchAllocations();
    } catch (err: any) {
      alert(err.message || 'Failed to end allocation');
    }
  };

  const displayedAllocations = allocationsPage?.content.filter(alloc => 
    (alloc.employeeName && alloc.employeeName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (alloc.projectCode && alloc.projectCode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (alloc.roleInProject && alloc.roleInProject.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Allocations Board</h1>
          <p className="page-subtitle">Allocate employee workload assignments to projects.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Assign Resource
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control form-control-search"
            placeholder="Search by employee, project or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="spinner-container">
          <Loader2 className="spinner" />
          <span style={{ marginLeft: '1rem' }}>Loading Allocations...</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" style={{ color: 'var(--color-danger)' }} />
          <div className="empty-state-title">Error Loading Allocations</div>
          <p>{error}</p>
        </div>
      ) : displayedAllocations.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <div className="empty-state-title">No Allocations Configured</div>
          <p>Assign employees to projects using the top-right button.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Project Code</th>
                  <th>Role in Project</th>
                  <th>Allocation %</th>
                  <th>Start Date</th>
                  <th>End Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedAllocations.map(alloc => (
                  <tr key={alloc.allocationId}>
                    <td style={{ fontWeight: 600 }}>{alloc.employeeName || `ID: ${alloc.employeeId}`}</td>
                    <td>{alloc.projectCode || `ID: ${alloc.projectId}`}</td>
                    <td>{alloc.roleInProject || '—'}</td>
                    <td style={{ fontWeight: 600, color: alloc.allocationPercent > 80 ? 'var(--color-warning)' : 'inherit' }}>
                      {alloc.allocationPercent}%
                    </td>
                    <td>{alloc.startDate || '—'}</td>
                    <td>{alloc.endDate || '—'}</td>
                    <td>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        background: alloc.status === 'ACTIVE' ? '#D1FAE5' : alloc.status === 'ENDED' ? '#F3F4F6' : '#FEF3C7',
                        color: alloc.status === 'ACTIVE' ? '#059669' : alloc.status === 'ENDED' ? '#4B5563' : '#D97706'
                      }}>
                        {alloc.status || 'PENDING'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        {(alloc.status === 'PENDING' || !alloc.status) && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Activate"
                            onClick={() => handleActivate(alloc.allocationId!)}
                          >
                            <Check size={16} />
                          </button>
                        )}
                        {(alloc.status === 'PENDING' || !alloc.status || alloc.status === 'ACTIVE') && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="End"
                            onClick={() => handleEnd(alloc.allocationId!)}
                          >
                            <Power size={16} style={{ color: 'var(--color-danger)' }} />
                          </button>
                        )}
                        {alloc.status !== 'ENDED' && (
                          <button
                            className="btn btn-secondary btn-icon"
                            title="Edit"
                            onClick={() => handleOpenEdit(alloc)}
                          >
                            <Edit2 size={16} />
                          </button>
                        )}
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(alloc.allocationId!)}
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
          {allocationsPage && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {page * size + 1} to {Math.min((page + 1) * size, allocationsPage.totalElements)} of {allocationsPage.totalElements} records
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
                  disabled={(page + 1) * size >= allocationsPage.totalElements}
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
              <h2 className="modal-title">{modalMode === 'create' ? 'Assign Resource Workload' : 'Modify Workload Allocation'}</h2>
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

                {loadingResources ? (
                  <div className="spinner-container" style={{ padding: '1.5rem' }}>
                    <Loader2 className="spinner" />
                    <span style={{ marginLeft: '1rem' }}>Loading Selector Data...</span>
                  </div>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Select Employee *</label>
                      <select
                        className="form-control"
                        disabled={modalMode === 'edit'}
                        value={formData.employeeId}
                        onChange={e => setFormData({ ...formData, employeeId: Number(e.target.value) })}
                      >
                        <option value={0}>Choose Employee...</option>
                        {employees.map(emp => (
                          <option key={emp.employeeId} value={emp.employeeId}>
                            {emp.fullName} ({emp.employeeCode})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Select Project *</label>
                      <select
                        className="form-control"
                        disabled={modalMode === 'edit'}
                        value={formData.projectId}
                        onChange={e => setFormData({ ...formData, projectId: Number(e.target.value) })}
                      >
                        <option value={0}>Choose Project...</option>
                        {projects.map(proj => (
                          <option key={proj.projectId} value={proj.projectId}>
                            {proj.projectName} [{proj.projectCode}]
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-row">
                      <div className="form-group">
                        <label>Allocation Percentage (1-100) *</label>
                        <input
                          type="number"
                          required
                          min={1}
                          max={100}
                          className="form-control"
                          value={formData.allocationPercent}
                          onChange={e => setFormData({ ...formData, allocationPercent: Number(e.target.value) })}
                        />
                      </div>

                      <div className="form-group">
                        <label>Role in Project</label>
                        <input
                          type="text"
                          className="form-control"
                          placeholder="e.g. Backend Lead"
                          value={formData.roleInProject}
                          onChange={e => setFormData({ ...formData, roleInProject: e.target.value })}
                        />
                      </div>
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
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loadingResources}>Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
