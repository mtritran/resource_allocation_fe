import React, { useEffect, useState } from 'react';
import { api, Employee, EmployeePage, WorkloadResponse } from '../services/api';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Loader2, AlertCircle, X, ChevronLeft, ChevronRight, Award } from 'lucide-react';

export const Employees: React.FC = () => {
  const [employeesPage, setEmployeesPage] = useState<EmployeePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [page, setPage] = useState(0);
  const size = 10;

  // Workload Modal/Detail View
  const [selectedWorkload, setSelectedWorkload] = useState<WorkloadResponse | null>(null);
  const [loadingWorkload, setLoadingWorkload] = useState(false);

  // Skills Manage Modal state
  const [selectedSkillsEmployee, setSelectedSkillsEmployee] = useState<Employee | null>(null);
  const [employeeSkills, setEmployeeSkills] = useState<{ skillId: number; skillName: string }[]>([]);
  const [loadingSkills, setLoadingSkills] = useState(false);
  const [newSkillsInput, setNewSkillsInput] = useState('');

  // Skill Search state
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [searchedSkill, setSearchedSkill] = useState('');
  const [skillSearchResults, setSkillSearchResults] = useState<{ employeeName: string; available: number }[] | null>(null);

  // Form Modal state
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Employee>({
    employeeCode: '',
    fullName: '',
    email: '',
    role: '',
    department: '',
  });
  const [editingId, setEditingId] = useState<number | null>(null);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getEmployees({
        department: departmentFilter || undefined,
        role: roleFilter || undefined,
        page,
        size,
      });
      setEmployeesPage(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch employees');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [page, departmentFilter, roleFilter]);

  const handleOpenCreate = () => {
    setModalMode('create');
    setFormData({
      employeeCode: '',
      fullName: '',
      email: '',
      role: '',
      department: '',
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (emp: Employee) => {
    setModalMode('edit');
    setFormData({
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      email: emp.email,
      role: emp.role,
      department: emp.department || '',
    });
    setEditingId(emp.employeeId || null);
    setFormError(null);
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      if (modalMode === 'create') {
        await api.createEmployee(formData);
      } else if (modalMode === 'edit' && editingId !== null) {
        await api.updateEmployee(editingId, formData);
      }
      setShowModal(false);
      fetchEmployees();
    } catch (err: any) {
      setFormError(err.message || 'Failed to save employee');
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this employee?')) return;
    try {
      await api.deleteEmployee(id);
      fetchEmployees();
    } catch (err: any) {
      alert(err.message || 'Failed to delete employee');
    }
  };

  const handleViewWorkload = async (id: number) => {
    try {
      setLoadingWorkload(true);
      const data = await api.getEmployeeWorkload(id);
      setSelectedWorkload(data);
    } catch (err: any) {
      alert(err.message || 'Failed to load workload details');
    } finally {
      setLoadingWorkload(false);
    }
  };

  const handleOpenSkills = async (emp: Employee) => {
    setSelectedSkillsEmployee(emp);
    setNewSkillsInput('');
    setEmployeeSkills([]);
    try {
      setLoadingSkills(true);
      const list = await api.getEmployeeSkills(emp.employeeId!);
      setEmployeeSkills(list);
    } catch (err: any) {
      alert(err.message || 'Failed to load employee skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSaveSkills = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkillsEmployee) return;
    const skillList = newSkillsInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    if (skillList.length === 0) return;

    try {
      setLoadingSkills(true);
      await api.assignEmployeeSkills(selectedSkillsEmployee.employeeId!, skillList);
      const list = await api.getEmployeeSkills(selectedSkillsEmployee.employeeId!);
      setEmployeeSkills(list);
      setNewSkillsInput('');
    } catch (err: any) {
      alert(err.message || 'Failed to save skills');
    } finally {
      setLoadingSkills(false);
    }
  };

  const handleSearchBySkill = async () => {
    if (!skillSearchQuery.trim()) return;
    try {
      const results = await api.searchEmployeesBySkill(skillSearchQuery.trim());
      setSkillSearchResults(results);
      setSearchedSkill(skillSearchQuery.trim());
    } catch (err: any) {
      alert(err.message || 'Failed to search by skill');
    }
  };

  const handleClearSkillSearch = () => {
    setSkillSearchQuery('');
    setSearchedSkill('');
    setSkillSearchResults(null);
  };

  // Filter clientside search
  const displayedEmployees = employeesPage?.content.filter(emp => 
    emp.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Employees Directory</h1>
          <p className="page-subtitle">Manage company staff records and review capacity workloads.</p>
        </div>
        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} /> Add Employee
        </button>
      </div>

      {/* Filter and Search Controls */}
      <div className="filter-bar">
        <div className="search-input-wrapper">
          <Search className="search-icon" />
          <input
            type="text"
            className="form-control form-control-search"
            placeholder="Search by name, code or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <select
          className="form-control filter-select"
          value={departmentFilter}
          onChange={(e) => { setDepartmentFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Departments</option>
          <option value="Delivery">Delivery</option>
          <option value="Cloud">Cloud</option>
          <option value="Consulting">Consulting</option>
          <option value="R&D">R&D</option>
        </select>

        <select
          className="form-control filter-select"
          value={roleFilter}
          onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
        >
          <option value="">All Roles</option>
          <option value="Java Developer">Java Developer</option>
          <option value="React Developer">React Developer</option>
          <option value="DevOps Engineer">DevOps Engineer</option>
          <option value="Project Manager">Project Manager</option>
          <option value="QA Engineer">QA Engineer</option>
        </select>
      </div>

      {/* Skill Search utility */}
      <div className="filter-bar" style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'stretch', padding: '1rem', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-md)' }}>
        <div style={{ fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem' }}>
          <Search size={16} /> Search Employees by Skill Name (Resource Search)
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            className="form-control"
            style={{ maxWidth: '280px', height: '36px' }}
            placeholder="Enter skill name (e.g. Java)..."
            value={skillSearchQuery}
            onChange={(e) => setSkillSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearchBySkill()}
          />
          <button className="btn btn-secondary" style={{ height: '36px' }} onClick={handleSearchBySkill}>Search</button>
          {searchedSkill && (
            <button className="btn btn-secondary" style={{ height: '36px' }} onClick={handleClearSkillSearch}>Clear</button>
          )}
        </div>
        
        {skillSearchResults && (
          <div style={{ marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
            <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Search Results for Skill: "{searchedSkill}"</h4>
            {skillSearchResults.length === 0 ? (
              <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>No employees found possessing this skill.</p>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.5rem' }}>
                {skillSearchResults.map((res, index) => (
                  <div key={index} style={{ padding: '0.5rem 0.75rem', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 'var(--border-radius-sm)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 500 }}>{res.employeeName}</span>
                    <span style={{ fontSize: '0.75rem', padding: '0.15rem 0.4rem', borderRadius: '4px', fontWeight: 600, background: res.available > 0 ? 'var(--color-success-bg)' : 'var(--bg-tertiary)', color: res.available > 0 ? 'var(--color-success)' : 'var(--text-secondary)' }}>
                      {res.available}% free
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="spinner-container">
          <Loader2 className="spinner" />
          <span style={{ marginLeft: '1rem' }}>Loading Employees...</span>
        </div>
      ) : error ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" style={{ color: 'var(--color-danger)' }} />
          <div className="empty-state-title">Error Loading Employees</div>
          <p>{error}</p>
        </div>
      ) : displayedEmployees.length === 0 ? (
        <div className="empty-state">
          <AlertCircle className="empty-state-icon" />
          <div className="empty-state-title">No Employees Found</div>
          <p>Try modifying your filters or add a new employee record.</p>
        </div>
      ) : (
        <>
          <div className="table-wrapper">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedEmployees.map(emp => (
                  <tr key={emp.employeeId}>
                    <td style={{ fontWeight: 600 }}>{emp.employeeCode}</td>
                    <td>{emp.fullName}</td>
                    <td>{emp.email}</td>
                    <td>{emp.role}</td>
                    <td>{emp.department || '—'}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="View Workload"
                          onClick={() => handleViewWorkload(emp.employeeId!)}
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Manage Skills"
                          onClick={() => handleOpenSkills(emp)}
                        >
                          <Award size={16} />
                        </button>
                        <button
                          className="btn btn-secondary btn-icon"
                          title="Edit"
                          onClick={() => handleOpenEdit(emp)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="btn btn-danger btn-icon"
                          title="Delete"
                          onClick={() => handleDelete(emp.employeeId!)}
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
          {employeesPage && (
            <div className="pagination">
              <span className="pagination-info">
                Showing {page * size + 1} to {Math.min((page + 1) * size, employeesPage.totalElements)} of {employeesPage.totalElements} records
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
                  disabled={(page + 1) * size >= employeesPage.totalElements}
                  onClick={() => setPage(page + 1)}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Workload Panel */}
      {selectedWorkload && (
        <div className="modal-overlay" onClick={() => setSelectedWorkload(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Resource Workload</h2>
              <button className="close-btn" onClick={() => setSelectedWorkload(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 600 }}>{selectedWorkload.employeeName}</h3>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Employee ID: {selectedWorkload.employeeId}</span>
              </div>

              <div className="workload-summary">
                <div className="workload-stat">
                  <span>Total Allocated:</span>
                  <span style={{ color: selectedWorkload.allocated > 90 ? 'var(--color-danger)' : 'inherit' }}>
                    {selectedWorkload.allocated}%
                  </span>
                </div>
                <div className="workload-stat">
                  <span>Available Capacity:</span>
                  <span style={{ color: selectedWorkload.available > 0 ? 'var(--color-success)' : 'inherit' }}>
                    {selectedWorkload.available}%
                  </span>
                </div>
              </div>

              <div style={{ marginTop: '0.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Project Breakdown</h4>
                {selectedWorkload.allocations.length === 0 ? (
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No current project allocations.</p>
                ) : (
                  <div className="workload-projects">
                    {selectedWorkload.allocations.map((alloc, idx) => (
                      <div key={idx} className="workload-project-item">
                        <span>Project: {alloc.projectCode}</span>
                        <span style={{ fontWeight: 600 }}>{alloc.allocationPercent}%</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedWorkload(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* CRUD Form Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title">{modalMode === 'create' ? 'Add New Employee' : 'Edit Employee'}</h2>
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
                  <label>Employee Code *</label>
                  <input
                    type="text"
                    required
                    disabled={modalMode === 'edit'}
                    className="form-control"
                    placeholder="e.g. EMP001"
                    value={formData.employeeCode}
                    onChange={e => setFormData({ ...formData, employeeCode: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Nguyen Van A"
                    value={formData.fullName}
                    onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    required
                    className="form-control"
                    placeholder="e.g. name@company.com"
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role *</label>
                    <input
                      type="text"
                      required
                      className="form-control"
                      placeholder="e.g. Java Developer"
                      value={formData.role}
                      onChange={e => setFormData({ ...formData, role: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Delivery"
                      value={formData.department}
                      onChange={e => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
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

      {/* Manage Skills Modal */}
      {selectedSkillsEmployee && (
        <div className="modal-overlay" onClick={() => setSelectedSkillsEmployee(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Manage Skills - {selectedSkillsEmployee.fullName}</h2>
              <button className="close-btn" onClick={() => setSelectedSkillsEmployee(null)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Current Skills</h4>
                {loadingSkills ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0' }}>
                    <Loader2 className="spinner" size={16} />
                    <span style={{ fontSize: '0.85rem' }}>Loading skills...</span>
                  </div>
                ) : employeeSkills.length === 0 ? (
                  <p style={{ fontStyle: 'italic', fontSize: '0.85rem', color: 'var(--text-muted)' }}>No skills assigned yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', margin: '0.5rem 0 1rem 0' }}>
                    {employeeSkills.map(sk => (
                      <span key={sk.skillId} className="badge badge-active" style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem', borderRadius: '4px', background: 'rgba(99, 102, 241, 0.1)', color: 'rgb(99, 102, 241)' }}>
                        {sk.skillName}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <form onSubmit={handleSaveSkills} style={{ marginTop: '1.25rem', borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
                <div className="form-group">
                  <label style={{ fontWeight: 600 }}>Assign New Skills</label>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '0 0 0.5rem 0' }}>Enter skill names separated by commas (e.g. Java, Docker, React)</p>
                  <input
                    type="text"
                    required
                    className="form-control"
                    placeholder="e.g. Java, React, SQL"
                    value={newSkillsInput}
                    onChange={e => setNewSkillsInput(e.target.value)}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1rem' }}>
                  <button type="button" className="btn btn-secondary" onClick={() => setSelectedSkillsEmployee(null)}>Close</button>
                  <button type="submit" className="btn btn-primary" disabled={loadingSkills}>
                    {loadingSkills ? <Loader2 className="spinner" size={16} /> : 'Assign'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
