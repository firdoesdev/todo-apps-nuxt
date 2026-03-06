<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn, FormSubmitEvent } from "@nuxt/ui";
import type { Column } from "@tanstack/vue-table";
import { type TodoCreateInput } from "./create/schema";

// ─── Resolve Nuxt UI components for h() render ───
const UCheckbox = resolveComponent("UCheckbox");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const USwitch = resolveComponent("USwitch");

// ─── Types ───
interface Todo {
  id: string;
  title: string;
  description: string | null;
  status: "PENDING" | "IN_PROGRESS" | "DONE";
  userId: string;
  createdAt: string;
}

interface TodoListResponse {
  data: Todo[];
  total: number;
  page: number;
  totalPages: number;
}

// ─── State ───
const toast = useToast();
const route = useRoute();
const router = useRouter();

// Search / Filter / Pagination / Sorting
const search = ref((route.query.search as string) || "");
const statusFilter = ref((route.query.status as string) || "ALL");
const currentPage = ref(Number(route.query.page) || 1);
const limit = ref(Number(route.query.limit) || 10);

const sorting = ref([
  {
    id: (route.query.sortBy as string) || "createdAt",
    desc: route.query.sortOrder ? route.query.sortOrder === "desc" : true,
  },
]);

const limitOptions = [
  { label: "10 / page", value: 10 },
  { label: "20 / page", value: 20 },
  { label: "50 / page", value: 50 },
];

const TodoStatus = {
  PENDING: "PENDING",
  IN_PROGRESS: "IN_PROGRESS",
  DONE: "DONE",
} as const;

// Debounced search
const debouncedSearch = ref(search.value);
let searchTimeout: ReturnType<typeof setTimeout>;
watch(search, (val) => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    debouncedSearch.value = val;
    if (currentPage.value !== 1) currentPage.value = 1;
  }, 300);
});

watch([statusFilter, limit], () => {
  if (currentPage.value !== 1) currentPage.value = 1;
});

// ─── Data Fetching ───
const {
  data: response,
  status: fetchStatus,
  refresh,
} = useFetch<TodoListResponse>("/api/todo", {
  query: computed(() => ({
    search: debouncedSearch.value || undefined,
    status: statusFilter.value !== "ALL" ? statusFilter.value : undefined,
    page: currentPage.value,
    limit: limit.value,
    sortBy: sorting.value[0]?.id || "createdAt",
    sortOrder: sorting.value[0]?.desc ? "desc" : "asc",
  })),
  watch: [debouncedSearch, statusFilter, currentPage, limit, sorting],
});

const todos = computed(() => response.value?.data ?? []);
const totalItems = computed(() => response.value?.total ?? 0);
const totalPages = computed(() => response.value?.totalPages ?? 1);
const isLoading = computed(() => fetchStatus.value === "pending");

// ─── Row Selection ───
const rowSelection = ref<Record<string, boolean>>({});
const selectedIds = computed(() => {
  return todos.value
    .filter((_, index) => rowSelection.value[index])
    .map((t) => t.id);
});

watch(todos, () => {
  rowSelection.value = {};
});

// ─── Modals ───
const showDeleteModal = ref(false);
const showBulkCreateModal = ref(false);
const showBulkDeleteModal = ref(false);

// ─── Delete ───
const deletingTodo = ref<Todo | null>(null);

function openDeleteModal(todo: Todo) {
  deletingTodo.value = todo;
  showDeleteModal.value = true;
}

const isDeleting = ref(false);
async function onDeleteConfirm() {
  if (!deletingTodo.value) return;
  isDeleting.value = true;
  try {
    await $fetch(`/api/todo/${deletingTodo.value.id}`, {
      method: "DELETE",
    });
    toast.add({
      title: "Todo berhasil dihapus",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    showDeleteModal.value = false;
    deletingTodo.value = null;
    await refresh();
  } catch (e: any) {
    toast.add({
      title: "Gagal menghapus todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    isDeleting.value = false;
  }
}

// ─── Bulk Create ───
const bulkItems = ref<TodoCreateInput[]>([
  { title: "", description: "", status: "PENDING" },
]);

function addBulkItem() {
  bulkItems.value.push({ title: "", description: "", status: "PENDING" });
}

function removeBulkItem(index: number) {
  if (bulkItems.value.length > 1) {
    bulkItems.value.splice(index, 1);
  }
}

function resetBulkCreate() {
  bulkItems.value = [{ title: "", description: "", status: "PENDING" }];
}

const isBulkCreating = ref(false);
async function onBulkCreateSubmit() {
  // Validate all items have title
  const invalid = bulkItems.value.some((item) => !item.title.trim());
  if (invalid) {
    toast.add({
      title: "Semua title harus diisi",
      color: "warning",
      icon: "i-lucide-alert-triangle",
    });
    return;
  }
  isBulkCreating.value = true;
  try {
    await $fetch("/api/todo/bulk", {
      method: "POST",
      body: { todos: bulkItems.value },
    });
    toast.add({
      title: `${bulkItems.value.length} todo berhasil ditambahkan`,
      color: "success",
      icon: "i-lucide-circle-check",
    });
    showBulkCreateModal.value = false;
    resetBulkCreate();
    await refresh();
  } catch (e: any) {
    toast.add({
      title: "Gagal menambahkan todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    isBulkCreating.value = false;
  }
}

// ─── Bulk Delete ───
const isBulkDeleting = ref(false);
async function onBulkDeleteConfirm() {
  if (selectedIds.value.length === 0) return;
  isBulkDeleting.value = true;
  try {
    await $fetch("/api/todo/bulk", {
      method: "DELETE",
      body: { ids: selectedIds.value },
    });
    toast.add({
      title: `${selectedIds.value.length} todo berhasil dihapus`,
      color: "success",
      icon: "i-lucide-circle-check",
    });
    showBulkDeleteModal.value = false;
    rowSelection.value = {};
    await refresh();
  } catch (e: any) {
    toast.add({
      title: "Gagal menghapus todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    isBulkDeleting.value = false;
  }
}

// ─── Status Badge Color ───
function getStatusColor(status: string) {
  return (
    {
      PENDING: "warning" as const,
      IN_PROGRESS: "info" as const,
      DONE: "success" as const,
    }[status] || ("neutral" as const)
  );
}

function getStatusLabel(status: string) {
  return (
    {
      PENDING: "Pending",
      IN_PROGRESS: "In Progress",
      DONE: "Done",
    }[status] || status
  );
}

// ─── Status Toggle ───
const togglingStatus = ref<Record<string, boolean>>({});

async function toggleStatus(todo: Todo, isDone: boolean) {
  if (togglingStatus.value[todo.id]) return;
  const nextStatus = isDone ? "DONE" : "IN_PROGRESS";
  togglingStatus.value[todo.id] = true;
  try {
    await $fetch(`/api/todo/${todo.id}`, {
      method: "PUT" as any,
      body: { status: nextStatus },
    });
    toast.add({
      title: `Status diubah ke ${getStatusLabel(nextStatus)}`,
      color: "success",
      icon: "i-lucide-circle-check",
    });
    await refresh();
  } catch (e: any) {
    toast.add({
      title: "Gagal mengubah status",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    delete togglingStatus.value[todo.id];
  }
}

// ─── Sortable Header Helper ───
function getSortableHeader(column: Column<Todo>, label: string) {
  const isSorted = column.getIsSorted();
  return h(UButton, {
    color: "neutral",
    variant: "ghost",
    label,
    icon: isSorted
      ? isSorted === "asc"
        ? "i-lucide-arrow-up-narrow-wide"
        : "i-lucide-arrow-down-wide-narrow"
      : "i-lucide-arrow-up-down",
    class: "-mx-2.5",
    onClick: () => column.toggleSorting(column.getIsSorted() === "asc"),
  });
}

// ─── Table Columns ───
const columnDefinitions: TableColumn<Todo>[] = [
  {
    id: "select",
    header: ({ table }) =>
      h(UCheckbox, {
        modelValue: table.getIsSomePageRowsSelected()
          ? "indeterminate"
          : table.getIsAllPageRowsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          table.toggleAllPageRowsSelected(!!value),
        "aria-label": "Select all",
      }),
    cell: ({ row }) =>
      h(UCheckbox, {
        modelValue: row.getIsSelected(),
        "onUpdate:modelValue": (value: boolean | "indeterminate") =>
          row.toggleSelected(!!value),
        "aria-label": "Select row",
      }),
  },
  {
    accessorKey: "title",
    header: ({ column }) => getSortableHeader(column, "Title"),
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, row.getValue("title") as string),
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => {
      const desc = row.getValue("description") as string | null;
      if (!desc) return h("span", { class: "text-muted italic" }, "—");
      return h(
        "span",
        { class: "truncate max-w-xs block", title: desc },
        desc.length > 60 ? `${desc.substring(0, 60)}...` : desc,
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => getSortableHeader(column, "Status"),
    cell: ({ row }) => {
      const todo = row.original;

      // PENDING: tampilkan badge saja tanpa switch
      if (todo.status === "PENDING") {
        return h(
          UBadge,
          { variant: "subtle", color: "warning" },
          () => "Pending",
        );
      }

      // IN_PROGRESS / DONE: tampilkan switch toggle
      const isDone = todo.status === "DONE";
      const isToggling = togglingStatus.value[todo.id];
      return h("div", { class: "flex items-center gap-2" }, [
        h(USwitch, {
          modelValue: isDone,
          "onUpdate:modelValue": (val: boolean) => toggleStatus(todo, val),
          disabled: isToggling,
          color: isDone ? "success" : "warning",
        }),
        h(
          "span",
          {
            class: `text-xs font-medium ${isDone ? "text-green-500" : "text-yellow-500"}`,
          },
          isDone ? "Done" : "In Progress",
        ),
      ]);
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => getSortableHeader(column, "Dibuat"),
    cell: ({ row }) => {
      const date = new Date(row.getValue("createdAt") as string);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    },
  },
  {
    id: "actions",
    header: "",
    meta: { class: { td: "text-right" } },
    cell: ({ row }) => {
      return h(
        UDropdownMenu,
        {
          content: { align: "end" as const },
          items: [
            {
              label: "Edit",
              icon: "i-lucide-pencil",
              onSelect() {
                router.push(`/todo/${row.original.id}/edit`);
              },
            },
            { type: "separator" as const },
            {
              label: "Hapus",
              icon: "i-lucide-trash-2",
              color: "error" as const,
              onSelect() {
                openDeleteModal(row.original);
              },
            },
          ],
        },
        () =>
          h(UButton, {
            icon: "i-lucide-ellipsis-vertical",
            color: "neutral",
            variant: "ghost",
            size: "sm",
          }),
      );
    },
  },
];

// ─── Column Filtering & URL Sync ───
const filterableColumns = [
  { label: "Title", value: "title" },
  { label: "Description", value: "description" },
  { label: "Status", value: "status" },
  { label: "Dibuat", value: "createdAt" },
];

const visibleColumnsDefault = filterableColumns.map((c) => c.value);
const visibleColumnKeys = ref<string[]>(
  route.query.columns
    ? (route.query.columns as string).split(",")
    : visibleColumnsDefault,
);

const columnMenu = computed(() => [
  filterableColumns.map((c) => ({
    label: c.label,
    type: "checkbox" as const,
    checked: visibleColumnKeys.value.includes(c.value),
    onUpdateChecked(checked: boolean) {
      if (checked) {
        if (!visibleColumnKeys.value.includes(c.value)) {
          visibleColumnKeys.value.push(c.value);
        }
      } else {
        visibleColumnKeys.value = visibleColumnKeys.value.filter(
          (v) => v !== c.value,
        );
      }
    },
  })),
]);

const columns = computed(() => {
  return columnDefinitions.filter((col) => {
    if (col.id === "select" || col.id === "actions") return true;
    const key = (col as any).accessorKey as string;
    return visibleColumnKeys.value.includes(key);
  });
});

// Sync states to URL
watch(
  [search, statusFilter, currentPage, limit, visibleColumnKeys, sorting],
  ([s, st, cp, l, vck, sort]) => {
    const currentSort = sort[0];
    router.replace({
      query: {
        ...route.query,
        search: s || undefined,
        status: st !== "ALL" ? st : undefined,
        page: cp,
        limit: l,
        columns:
          vck.length === filterableColumns.length ? undefined : vck.join(","),
        sortBy: currentSort?.id !== "createdAt" ? currentSort?.id : undefined,
        sortOrder:
          currentSort?.id === "createdAt" && currentSort?.desc !== false
            ? undefined
            : currentSort?.desc
              ? "desc"
              : "asc",
      },
    });
  },
);

const todoStatusOptions = [
  { label: "Pending", value: TodoStatus.PENDING },
  { label: "In Progress", value: TodoStatus.IN_PROGRESS },
  { label: "Done", value: TodoStatus.DONE },
];

// ─── Filter options for dropdown ───
const statusFilterOptions = [
  { label: "Semua Status", value: "ALL" },
  ...todoStatusOptions,
];
</script>

<template>
  <div class="py-8 space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold">Todo</h1>
        <p class="text-sm text-muted mt-1">Kelola daftar tugas kamu</p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-plus"
          label="Bulk Add"
          color="neutral"
          variant="outline"
          @click="showBulkCreateModal = true"
        />
        <UButton icon="i-lucide-plus" label="Add Todo" to="/todo/create" />
      </div>
    </div>

    <!-- Toolbar: Search + Filter + Bulk Actions -->
    <div class="flex items-center gap-3 flex-wrap">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Cari todo..."
        class="max-w-xs flex-1"
      />
      <USelect
        v-model="statusFilter"
        :items="statusFilterOptions"
        value-key="value"
        placeholder="Filter status"
        class="w-44"
      />
      <USelect
        v-model="limit"
        :items="limitOptions"
        value-key="value"
        class="w-28"
      />
      <UDropdownMenu :items="columnMenu" :content="{ align: 'end' as const }">
        <UButton
          color="neutral"
          variant="outline"
          icon="i-lucide-columns"
          label="View"
        />
      </UDropdownMenu>

      <div
        v-if="selectedIds.length > 0"
        class="ml-auto flex items-center gap-2"
      >
        <span class="text-sm text-muted">{{ selectedIds.length }} dipilih</span>
        <UButton
          icon="i-lucide-trash-2"
          label="Delete Selected"
          color="error"
          variant="soft"
          size="sm"
          @click="showBulkDeleteModal = true"
        />
      </div>
    </div>

    <!-- Table -->
    <div class="border border-default rounded-lg overflow-hidden">
      <UTable
        v-model:sorting="sorting"
        v-model:row-selection="rowSelection"
        :sorting-options="{ manualSorting: true }"
        :data="todos"
        :columns="columns"
        :loading="isLoading"
        class="w-full"
      />

      <!-- Pagination Footer -->
      <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-4 py-3 border-t border-default"
      >
        <span class="text-sm text-muted">
          Menampilkan {{ todos.length }} dari {{ totalItems }} todo
        </span>
        <UPagination
          :page="currentPage"
          :items-per-page="limit"
          :total="totalItems"
          @update:page="(p) => (currentPage = p)"
        />
      </div>

      <!-- Empty state -->
      <div
        v-if="!isLoading && todos.length === 0"
        class="flex flex-col items-center justify-center py-12 text-muted"
      >
        <UIcon name="i-lucide-inbox" class="text-4xl mb-2" />
        <p class="text-lg font-medium">Belum ada todo</p>
        <p class="text-sm">
          Klik tombol "Add Todo" untuk menambahkan tugas baru
        </p>
      </div>
    </div>

    <!-- ─── Delete Confirmation Modal ─── -->
    <UModal
      v-model:open="showDeleteModal"
      title="Hapus Todo"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <p>
          Apakah kamu yakin ingin menghapus todo
          <strong>"{{ deletingTodo?.title }}"</strong>?
        </p>
      </template>
      <template #footer>
        <UButton
          label="Batal"
          color="neutral"
          variant="outline"
          @click="showDeleteModal = false"
        />
        <UButton
          label="Hapus"
          color="error"
          :loading="isDeleting"
          @click="onDeleteConfirm"
        />
      </template>
    </UModal>

    <!-- ─── Bulk Create Modal ─── -->
    <UModal
      v-model:open="showBulkCreateModal"
      title="Bulk Add Todo"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <div class="space-y-4 max-h-96 overflow-y-auto">
          <div
            v-for="(item, index) in bulkItems"
            :key="index"
            class="flex gap-3 items-start p-3 border border-default rounded-lg"
          >
            <div class="flex-1 space-y-2">
              <UInput
                v-model="item.title"
                placeholder="Title *"
                class="w-full"
              />
              <UInput
                v-model="item.description"
                placeholder="Description (opsional)"
                class="w-full"
              />
              <USelect
                v-model="item.status"
                :items="todoStatusOptions"
                value-key="value"
                class="w-full"
              />
            </div>
            <UButton
              v-if="bulkItems.length > 1"
              icon="i-lucide-x"
              color="error"
              variant="ghost"
              size="sm"
              @click="removeBulkItem(index)"
            />
          </div>
        </div>
        <UButton
          icon="i-lucide-plus"
          label="Tambah item"
          color="neutral"
          variant="outline"
          class="mt-3 w-full"
          @click="addBulkItem"
        />
      </template>
      <template #footer>
        <UButton
          label="Batal"
          color="neutral"
          variant="outline"
          @click="showBulkCreateModal = false"
        />
        <UButton
          :label="`Simpan ${bulkItems.length} todo`"
          :loading="isBulkCreating"
          @click="onBulkCreateSubmit"
        />
      </template>
    </UModal>

    <!-- ─── Bulk Delete Confirmation Modal ─── -->
    <UModal
      v-model:open="showBulkDeleteModal"
      title="Hapus Todo"
      :ui="{ footer: 'justify-end' }"
    >
      <template #body>
        <p>
          Apakah kamu yakin ingin menghapus
          <strong>{{ selectedIds.length }}</strong> todo yang dipilih?
        </p>
      </template>
      <template #footer>
        <UButton
          label="Batal"
          color="neutral"
          variant="outline"
          @click="showBulkDeleteModal = false"
        />
        <UButton
          label="Hapus Semua"
          color="error"
          :loading="isBulkDeleting"
          @click="onBulkDeleteConfirm"
        />
      </template>
    </UModal>
  </div>
</template>
