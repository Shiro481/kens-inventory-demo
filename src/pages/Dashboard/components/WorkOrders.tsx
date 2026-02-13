import { useState, useMemo } from 'react';
import {
  Plus, Calendar, Clock, AlertTriangle, CheckCircle, Wrench,
  MoreHorizontal, User, Car, X, Trash2, Edit2, Search,
  Filter, Grid3X3, List, Settings,
  ChevronDown, RefreshCw
} from 'lucide-react';
import styles from './WorkOrders.module.css';

type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
type JobStatus = 'Pending' | 'In Progress' | 'Waiting' | 'Completed';

interface WorkOrder {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  priority: Priority;
  customer_name: string;
  customer_email?: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  assigned_to?: string;
  created_at: string;
  due_date?: string;
  estimated_cost: number;
  actual_cost?: number;
  items: Array<{
    name: string;
    quantity: number;
    part_id?: number;
  }>;
  notes?: string;
}

// Enhanced mock data
const MOCK_JOBS: WorkOrder[] = [
  {
    id: 'WO001',
    title: 'Brake Pad Replacement',
    description: 'Replace front brake pads and rotors on 2018 Honda Civic with ceramic pads for improved stopping power',
    status: 'In Progress',
    priority: 'High',
    customer_name: 'John Smith',
    customer_email: 'john.smith@email.com',
    vehicle_make: 'Honda',
    vehicle_model: 'Civic',
    vehicle_year: '2018',
    assigned_to: 'Mike Johnson',
    created_at: '2024-01-15',
    due_date: '2024-01-20',
    estimated_cost: 450.00,
    actual_cost: 380.00,
    items: [
      { name: 'Front Brake Pads', quantity: 2, part_id: 1001 },
      { name: 'Front Rotors', quantity: 2, part_id: 1002 }
    ],
    notes: 'Customer reported squeaking noise when braking'
  },
  {
    id: 'WO002',
    title: 'Oil Change Service',
    description: 'Complete oil change with synthetic 5W-30 oil, new filter, and multi-point inspection',
    status: 'Pending',
    priority: 'Medium',
    customer_name: 'Sarah Davis',
    vehicle_make: 'Toyota',
    vehicle_model: 'Camry',
    vehicle_year: '2020',
    assigned_to: 'Tom Wilson',
    created_at: '2024-01-16',
    due_date: '2024-01-18',
    estimated_cost: 65.00,
    items: [
      { name: 'Engine Oil 5W-30', quantity: 1, part_id: 2001 },
      { name: 'Oil Filter', quantity: 1, part_id: 2002 }
    ]
  },
  {
    id: 'WO003',
    title: 'Transmission Diagnostic',
    description: 'Comprehensive transmission diagnostic to identify slipping issue between gears',
    status: 'Waiting',
    priority: 'Critical',
    customer_name: 'Robert Brown',
    vehicle_make: 'Ford',
    vehicle_model: 'F-150',
    vehicle_year: '2016',
    assigned_to: 'Sarah Chen',
    created_at: '2024-01-14',
    due_date: '2024-01-17',
    estimated_cost: 120.00,
    items: [],
    notes: 'Customer reports transmission slipping between gears 2-3'
  },
  {
    id: 'WO004',
    title: 'Tire Rotation & Balance',
    description: 'Rotate all four tires and balance for optimal performance and even wear',
    status: 'Completed',
    priority: 'Low',
    customer_name: 'Emily Johnson',
    vehicle_make: 'Nissan',
    vehicle_model: 'Altima',
    vehicle_year: '2019',
    assigned_to: 'Mike Johnson',
    created_at: '2024-01-13',
    due_date: '2024-01-15',
    estimated_cost: 40.00,
    actual_cost: 40.00,
    items: []
  },
  {
    id: 'WO005',
    title: 'Battery Replacement',
    description: 'Replace dead battery with new heavy-duty battery and test charging system',
    status: 'In Progress',
    priority: 'Medium',
    customer_name: 'David Wilson',
    vehicle_make: 'Chevrolet',
    vehicle_model: 'Silverado',
    vehicle_year: '2017',
    assigned_to: 'Tom Wilson',
    created_at: '2024-01-17',
    due_date: '2024-01-19',
    estimated_cost: 150.00,
    items: [
      { name: 'Heavy Duty Battery', quantity: 1, part_id: 3001 }
    ]
  }
];

type ViewMode = 'kanban' | 'list' | 'grid';
type SortOption = 'newest' | 'oldest' | 'priority' | 'due_date' | 'status';

export default function WorkOrders() {
  const [jobs, setJobs] = useState<WorkOrder[]>(MOCK_JOBS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<JobStatus | 'all'>('all');
  const [priorityFilter, setPriorityFilter] = useState<Priority | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<WorkOrder | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  /**
   * Filter and sort jobs based on search query, status, priority, and sort options
   * Returns a memoized array of filtered and sorted work orders
   */
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs.filter(job => {
      const matchesSearch = searchQuery === '' ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === 'all' || job.status === statusFilter;
      const matchesPriority = priorityFilter === 'all' || job.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });

    // Sort jobs
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'priority':
          const priorityOrder = { Critical: 4, High: 3, Medium: 2, Low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'due_date':
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        case 'status':
          const statusOrder = { Pending: 1, 'In Progress': 2, Waiting: 3, Completed: 4 };
          return statusOrder[a.status] - statusOrder[b.status];
        default:
          return 0;
      }
    });

    return filtered;
  }, [jobs, searchQuery, statusFilter, priorityFilter, sortBy]);

  /**
   * Calculate statistics for the work orders dashboard
   * Returns total, completed, in progress, and overdue job counts
   */
  const stats = useMemo(() => {
    const total = jobs.length;
    const completed = jobs.filter(j => j.status === 'Completed').length;
    const inProgress = jobs.filter(j => j.status === 'In Progress').length;
    const overdue = jobs.filter(j => j.due_date && new Date(j.due_date) < new Date() && j.status !== 'Completed').length;

    return { total, completed, inProgress, overdue };
  }, [jobs]);

  /**
   * Open the modal for creating a new work order
   */
  const handleCreate = () => {
    setEditingJob(null);
    setIsModalOpen(true);
  };

  /**
   * Open the modal for editing an existing work order
   * @param job - The work order to edit
   */
  const handleEdit = (job: WorkOrder) => {
    setEditingJob(job);
    setIsModalOpen(true);
  };

  /**
   * Delete a work order after confirmation
   * @param jobId - The ID of the work order to delete
   */
  const handleDelete = async (jobId: string) => {
    if (window.confirm('Are you sure you want to delete this work order?')) {
      setJobs(jobs.filter(j => j.id !== jobId));
    }
  };

  /**
   * Update the status of a work order
   * @param jobId - The ID of the work order to update
   * @param newStatus - The new status to set
   */
  const handleStatusChange = (jobId: string, newStatus: JobStatus) => {
    setJobs(jobs.map(job =>
      job.id === jobId ? { ...job, status: newStatus } : job
    ));
  };

  /**
   * Reset all filters to their default values
   */
  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setSortBy('newest');
  };

  const boardColumns: JobStatus[] = ['Pending', 'In Progress', 'Waiting', 'Completed'];

  return (
    <div className={styles.container}>
      {/* Enhanced Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.titleSection}>
            <h1 className={styles.title}>Work Orders</h1>
            <div className={styles.subtitle}>
              <span className={styles.badge}>{stats.total} Total</span>
              <span className={styles.badge + ' ' + styles.completed}>{stats.completed} Completed</span>
              <span className={styles.badge + ' ' + styles.inProgress}>{stats.inProgress} In Progress</span>
              {stats.overdue > 0 && (
                <span className={styles.badge + ' ' + styles.overdue}>{stats.overdue} Overdue</span>
              )}
            </div>
          </div>
        </div>

        <div className={styles.headerRight}>
          <div className={styles.searchBar}>
            <Search size={18} className={styles.searchIcon} />
            <input
              type="text"
              placeholder="Search work orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <div className={styles.viewControls}>
            <button
              className={`${styles.viewButton} ${viewMode === 'kanban' ? styles.active : ''}`}
              onClick={() => setViewMode('kanban')}
              title="Kanban View"
            >
              <Grid3X3 size={18} />
            </button>
            <button
              className={`${styles.viewButton} ${viewMode === 'list' ? styles.active : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>

          <button
            className={styles.filterButton}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span>Filters</span>
            <ChevronDown size={14} className={showFilters ? styles.rotated : ''} />
          </button>

          <button
            className={styles.createButton}
            onClick={handleCreate}
          >
            <Plus size={18} />
            <span>New Order</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className={styles.filtersPanel}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as JobStatus | 'all')}
                className={styles.filterSelect}
              >
                <option value="all">All Status</option>
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Waiting">Waiting</option>
                <option value="Completed">Completed</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Priority</label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as Priority | 'all')}
                className={styles.filterSelect}
              >
                <option value="all">All Priority</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                className={styles.filterSelect}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="priority">Priority</option>
                <option value="due_date">Due Date</option>
                <option value="status">Status</option>
              </select>
            </div>

            <button
              className={styles.clearFilters}
              onClick={clearFilters}
            >
              <RefreshCw size={14} />
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Content Area */}
      <div className={styles.content}>
        {viewMode === 'kanban' && (
          <div className={styles.kanbanBoard}>
            {boardColumns.map((column) => {
              const columnJobs = filteredAndSortedJobs.filter(job => job.status === column);

              return (
                <div key={column} className={styles.column}>
                  <div className={styles.columnHeader}>
                    <div className={styles.columnTitle}>
                      <div className={styles.statusIcon}>
                        {column === 'Pending' && <Clock size={16} />}
                        {column === 'In Progress' && <Wrench size={16} />}
                        {column === 'Waiting' && <AlertTriangle size={16} />}
                        {column === 'Completed' && <CheckCircle size={16} />}
                      </div>
                      <span>{column}</span>
                    </div>
                    <span className={styles.columnCount}>{columnJobs.length}</span>
                  </div>

                  <div className={styles.columnContent}>
                    {columnJobs.map((job) => (
                      <JobCard
                        key={job.id}
                        job={job}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onStatusChange={handleStatusChange}
                      />
                    ))}

                    {columnJobs.length === 0 && (
                      <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>
                          📋
                        </div>
                        <p>No {column.toLowerCase()} orders</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === 'list' && (
          <div className={styles.listView}>
            <div className={styles.listHeader}>
              <div className={styles.listCol}>Order ID</div>
              <div className={styles.listCol}>Title</div>
              <div className={styles.listCol}>Customer</div>
              <div className={styles.listCol}>Priority</div>
              <div className={styles.listCol}>Status</div>
              <div className={styles.listCol}>Due Date</div>
              <div className={styles.listCol}>Actions</div>
            </div>

            {filteredAndSortedJobs.map((job) => (
              <div key={job.id} className={styles.listRow}>
                <div className={styles.listCol}>
                  <span className={styles.orderId}>{job.id}</span>
                </div>
                <div className={styles.listCol}>
                  <div className={styles.jobTitle}>{job.title}</div>
                  <div className={styles.jobDescription}>{job.description.substring(0, 60)}...</div>
                </div>
                <div className={styles.listCol}>
                  <div className={styles.customerName}>{job.customer_name}</div>
                  <div className={styles.vehicleInfo}>
                    {job.vehicle_year} {job.vehicle_make} {job.vehicle_model}
                  </div>
                </div>
                <div className={styles.listCol}>
                  <span className={`${styles.priorityBadge} ${styles[job.priority.toLowerCase()]}`}>
                    {job.priority}
                  </span>
                </div>
                <div className={styles.listCol}>
                  <span className={`${styles.statusBadge} ${styles[job.status.toLowerCase().replace(' ', '')]}`}>
                    {job.status}
                  </span>
                </div>
                <div className={styles.listCol}>
                  <div className={styles.dueDate}>
                    {job.due_date ? new Date(job.due_date).toLocaleDateString() : 'No due date'}
                  </div>
                </div>
                <div className={styles.listCol}>
                  <div className={styles.listActions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleEdit(job)}
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleDelete(job.id)}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}

            {filteredAndSortedJobs.length === 0 && (
              <div className={styles.noResults}>
                <div className={styles.noResultsIcon}>🔍</div>
                <h3>No work orders found</h3>
                <p>Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal (placeholder - will be enhanced) */}
      {isModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h2 className={styles.modalTitle}>
                {editingJob ? 'Edit Work Order' : 'New Work Order'}
              </h2>
              <button
                className={styles.closeButton}
                onClick={() => setIsModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <div className={styles.comingSoon}>
                <Settings size={48} />
                <h3>Enhanced Form Coming Soon</h3>
                <p>The advanced work order form with full CRUD functionality is being implemented.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface JobCardProps {
  job: WorkOrder;
  onEdit: (job: WorkOrder) => void;
  onDelete: (jobId: string) => void;
  onStatusChange: (jobId: string, newStatus: JobStatus) => void;
}

/**
 * JobCard component - Displays individual work order information in the kanban view
 * @param job - The work order data to display
 * @param onEdit - Callback function for editing the job
 * @param onDelete - Callback function for deleting the job
 * @param onStatusChange - Callback function for changing job status
 */
const JobCard = ({ job, onEdit, onDelete, onStatusChange }: JobCardProps) => {
  const [showActions, setShowActions] = useState(false);

  /**
   * Handle status change for the current job
   * @param newStatus - The new status to set for the job
   */
  const handleStatusChange = (newStatus: JobStatus) => {
    onStatusChange(job.id, newStatus);
  };

  return (
    <div className={`bg-zinc-900 rounded-lg p-4 mb-3 transition-all hover:shadow-lg ${getStatusColor(job.status)}`}>
      {/* Card Header */}
      <div className="flex justify-between items-start mb-3">
        <div className="flex-1">
          <h3 className="font-bold text-white text-sm uppercase tracking-wide mb-1">{job.title}</h3>
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold uppercase px-2 py-1 rounded ${getPriorityColor(job.priority)}`}>
              {job.priority}
            </span>
            <span className="text-xs text-zinc-500">#{job.id}</span>
          </div>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowActions(!showActions)}
            className="text-zinc-500 hover:text-white p-1"
          >
            <MoreHorizontal size={16} />
          </button>

          {showActions && (
            <div className="absolute right-0 top-8 bg-zinc-800 border border-zinc-700 rounded-lg shadow-lg py-1 z-10 min-w-[150px]">
              <button
                onClick={() => { onEdit(job); setShowActions(false); }}
                className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white flex items-center gap-2"
              >
                <Edit2 size={14} /> Edit
              </button>
              <button
                onClick={() => { onDelete(job.id); setShowActions(false); }}
                className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 hover:text-red-300 flex items-center gap-2"
              >
                <Trash2 size={14} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Customer & Vehicle Info */}
      <div className="mb-3">
        <div className="flex items-center gap-2 text-xs text-zinc-400 mb-1">
          <User size={12} />
          <span>{job.customer_name}</span>
        </div>
        {job.vehicle_make && job.vehicle_model && (
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <Car size={12} />
            <span>{job.vehicle_year} {job.vehicle_make} {job.vehicle_model}</span>
          </div>
        )}
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-xs text-zinc-500 mb-3 line-clamp-2">{job.description}</p>
      )}

      {/* Quick Actions */}
      <div className="flex gap-1">
        {job.status !== 'In Progress' && (
          <button
            onClick={() => handleStatusChange('In Progress')}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-black text-xs font-bold py-2 px-2 rounded transition-colors"
          >
            <Wrench size={12} className="inline mr-1" />
            Start
          </button>
        )}
        {job.status !== 'Completed' && (
          <button
            onClick={() => handleStatusChange('Completed')}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-black text-xs font-bold py-2 px-2 rounded transition-colors"
          >
            <CheckCircle size={12} className="inline mr-1" />
            Complete
          </button>
        )}
      </div>

      {/* Footer Info */}
      <div className="flex justify-between items-center mt-3 pt-3 border-t border-zinc-800">
        <div className="text-xs text-zinc-500">
          {job.assigned_to && (
            <div className="flex items-center gap-1">
              <Wrench size={10} />
              <span>{job.assigned_to}</span>
            </div>
          )}
        </div>
        {job.due_date && (
          <div className="text-xs text-zinc-500 flex items-center gap-1">
            <Calendar size={10} />
            <span>{new Date(job.due_date).toLocaleDateString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Get the appropriate CSS class for a job status
 * @param s - The job status
 * @returns CSS class string for styling the status
 */
const getStatusColor = (s: JobStatus): string => {
  switch (s) {
    case 'In Progress': return 'border-l-4 border-l-blue-500';
    case 'Waiting': return 'border-l-4 border-l-amber-500';
    case 'Completed': return 'border-l-4 border-l-emerald-500';
    default: return 'border-l-4 border-l-zinc-500';
  }
};

/**
 * Get the appropriate CSS class for a priority level
 * @param p - The priority level
 * @returns CSS class string for styling the priority badge
 */
const getPriorityColor = (p: Priority): string => {
  switch (p) {
    case 'Critical': return 'text-red-500 bg-red-500/10 border-red-500/20';
    case 'High': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
    case 'Medium': return 'text-blue-500 bg-blue-500/10 border-blue-500/20';
    case 'Low': return 'text-zinc-500 bg-zinc-500/10 border-zinc-500/20';
    default: return 'text-zinc-500';
  }
};
