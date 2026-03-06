<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormSubmitEvent } from "@nuxt/ui";
import {
  todoCreateSchema,
  todoStatusOptions,
  type TodoCreateInput,
} from "./todo";

const toast = useToast();
const router = useRouter();

const state = reactive<TodoCreateInput>({
  title: "",
  description: "",
  status: "PENDING",
});

const isCreating = ref(false);

async function onSubmit(event: FormSubmitEvent<TodoCreateInput>) {
  isCreating.value = true;
  try {
    await $fetch("/api/todo", {
      method: "POST",
      body: event.data,
    });
    toast.add({
      title: "Todo berhasil ditambahkan",
      color: "success",
      icon: "i-lucide-circle-check",
    });
    router.push("/todo");
  } catch (e: any) {
    toast.add({
      title: "Gagal menambahkan todo",
      description: e?.data?.statusMessage || "Terjadi kesalahan",
      color: "error",
      icon: "i-lucide-circle-x",
    });
  } finally {
    isCreating.value = false;
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
        <h1 class="text-2xl font-bold">Tambah Todo</h1>
        <p class="text-sm text-muted mt-1">Buat tugas baru</p>
      </div>
    </div>

    <div class="border border-default rounded-lg p-6 bg-white dark:bg-gray-900">
      <UForm
        id="create-form"
        :schema="todoCreateSchema"
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
          <UButton label="Simpan" type="submit" :loading="isCreating" />
        </div>
      </UForm>
    </div>
  </div>
</template>
