<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  todoUpdateSchema,
  todoStatusOptions,
  type TodoUpdateInput,
} from "./schema";

const toast = useToast();
const route = useRoute();
const router = useRouter();

const todoId = route.params.id as string;

const state = reactive<TodoUpdateInput>({
  title: "",
  description: "",
  status: "PENDING",
});

const isLoading = ref(true);
const isSaving = ref(false);

onMounted(async () => {
  try {
    const data = await $fetch<any>(`/api/todo/${todoId}`);
    if (data) {
      state.title = data.title;
      state.description = data.description || "";
      state.status = data.status;
    }
  } catch (e: any) {
    toast.add({
      title: "Gagal memuat data todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
    router.push("/todo");
  } finally {
    isLoading.value = false;
  }
});

async function onSubmit(event: FormSubmitEvent<TodoUpdateInput>) {
  isSaving.value = true;
  try {
    await $fetch(`/api/todo/${todoId}`, {
      method: "PUT" as any,
      body: event.data,
    });
    toast.add({
      title: "Todo berhasil diperbarui",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    router.push("/todo");
  } catch (e: any) {
    toast.add({
      title: "Gagal memperbarui todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="py-8 max-w-2xl mx-auto space-y-6">
    <div class="flex items-center gap-4">
      <UButton
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        to="/todo"
      />
      <div>
        <h1 class="text-2xl font-bold">Edit Todo</h1>
        <p class="text-sm text-muted mt-1">Perbarui informasi tugas</p>
      </div>
    </div>

    <div v-if="isLoading" class="flex justify-center p-12">
      <UIcon
        name="i-lucide-loader-2"
        class="text-4xl text-primary animate-spin"
      />
    </div>

    <div
      v-else
      class="border border-default rounded-lg p-6 bg-white dark:bg-gray-900"
    >
      <UForm
        id="edit-form"
        :schema="todoUpdateSchema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <UFormField label="Title" name="title" required>
          <UInput
            v-model="state.title"
            placeholder="Judul todo"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Description" name="description">
          <UTextarea
            v-model="state.description"
            placeholder="Deskripsi (opsional)"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Status" name="status">
          <USelect
            v-model="state.status"
            :items="todoStatusOptions"
            value-key="value"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-3 pt-4 border-t border-default mt-6">
          <UButton label="Batal" color="neutral" variant="outline" to="/todo" />
          <UButton label="Simpan" type="submit" :loading="isSaving" />
        </div>
      </UForm>
    </div>
  </div>
</template>
