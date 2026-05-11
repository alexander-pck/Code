<script setup lang="ts">
import { computed, ref } from 'vue'
import 'mathlive'

type Variable =
  | {
      name: string
      type: 'scalar'
      scalarValue: number
    }
  | {
      name: string
      type: 'vector'
      vectorValue: number[]
    }

type Snapshot = {
  createdAt: string
  expression: string
  variableCount: number
}

const mathExpression = ref('')
const variableName = ref('')
const variableValue = ref('')
const filterName = ref('')
const filterType = ref<'all' | Variable['type']>('all')
const operation = ref<'+' | '-' | '*' | '/'>('+')
const leftVectorName = ref('')
const rightVectorName = ref('')
const variables = ref<Variable[]>([])
const history = ref<Snapshot[]>([])
const variableError = ref('')

const parseVariableValue = (input: string): { type: Variable['type']; value: number | number[] } | null => {
  const normalized = input.trim()

  if (!normalized) {
    return null
  }

  if (normalized.includes(',')) {
    const vector = normalized
      .split(',')
      .map((part) => Number(part.trim()))
      .filter((part) => !Number.isNaN(part))

    if (vector.length === 0 || vector.length !== normalized.split(',').length) {
      return null
    }

    return { type: 'vector', value: vector }
  }

  const scalar = Number(normalized)

  if (Number.isNaN(scalar)) {
    return null
  }

  return { type: 'scalar', value: scalar }
}

const addVariable = () => {
  variableError.value = ''

  const name = variableName.value.trim()

  if (!name) {
    variableError.value = 'Variable name is required.'
    return
  }

  const parsed = parseVariableValue(variableValue.value)

  if (!parsed) {
    variableError.value = 'Use a number for scalar values or comma-separated numbers for vectors.'
    return
  }

  const nextVariable: Variable =
    parsed.type === 'scalar'
      ? {
          name,
          type: 'scalar',
          scalarValue: parsed.value as number,
        }
      : {
          name,
          type: 'vector',
          vectorValue: parsed.value as number[],
        }

  const existingIndex = variables.value.findIndex((item) => item.name === name)

  if (existingIndex >= 0) {
    variables.value.splice(existingIndex, 1, nextVariable)
  } else {
    variables.value.push(nextVariable)
  }

  variableName.value = ''
  variableValue.value = ''
}

const saveSnapshot = () => {
  history.value.unshift({
    createdAt: new Date().toISOString(),
    expression: mathExpression.value,
    variableCount: variables.value.length,
  })
}

const filteredVariables = computed(() => {
  return variables.value.filter((item) => {
    const matchesName = item.name.toLowerCase().includes(filterName.value.trim().toLowerCase())
    const matchesType = filterType.value === 'all' || item.type === filterType.value
    return matchesName && matchesType
  })
})

const vectorVariables = computed(() =>
  variables.value.filter((item): item is Extract<Variable, { type: 'vector' }> => item.type === 'vector'),
)

const parseOperation = (symbol: typeof operation.value, left: number, right: number) => {
  if (symbol === '+') {
    return left + right
  }

  if (symbol === '-') {
    return left - right
  }

  if (symbol === '*') {
    return left * right
  }

  return left / right
}

const elementWiseResult = computed(() => {
  const left = vectorVariables.value.find((item) => item.name === leftVectorName.value)
  const right = vectorVariables.value.find((item) => item.name === rightVectorName.value)

  if (!left || !right) {
    return { result: '', error: 'Select two vector variables.' }
  }

  if (left.vectorValue.length !== right.vectorValue.length) {
    return { result: '', error: 'Vectors must have the same length.' }
  }

  const values = left.vectorValue.map((value, index) =>
    parseOperation(operation.value, value, right.vectorValue[index]!),
  )

  if (values.some((value) => !Number.isFinite(value))) {
    return { result: '', error: 'Result contains non-finite values.' }
  }

  return { result: values.join(', '), error: '' }
})

const onMathInput = (event: Event) => {
  const target = event.target as HTMLElement & { value?: string }
  mathExpression.value = target.value ?? ''
}
</script>

<template>
  <main class="dashboard">
    <h1>Interactive Math Dashboard</h1>

    <section class="card">
      <h2>Math Input</h2>
      <math-field
        data-testid="math-input"
        class="math-field"
        :value="mathExpression"
        @input="onMathInput"
      ></math-field>
      <p data-testid="math-preview">Expression: {{ mathExpression || '—' }}</p>
      <button data-testid="save-snapshot" type="button" @click="saveSnapshot">Save snapshot</button>
    </section>

    <section class="card">
      <h2>Variables</h2>
      <div class="row">
        <input
          v-model="variableName"
          data-testid="variable-name"
          placeholder="Name"
          aria-label="Variable name"
        />
        <input
          v-model="variableValue"
          data-testid="variable-value"
          placeholder="Value (e.g. 5 or 1,2,3)"
          aria-label="Variable value"
        />
        <button data-testid="add-variable" type="button" @click="addVariable">Add / Update</button>
      </div>
      <p v-if="variableError" data-testid="variable-error">{{ variableError }}</p>

      <div class="row">
        <input
          v-model="filterName"
          data-testid="filter-name"
          placeholder="Filter by name"
          aria-label="Filter by name"
        />
        <select v-model="filterType" data-testid="filter-type" aria-label="Filter by type">
          <option value="all">All types</option>
          <option value="scalar">Scalar</option>
          <option value="vector">Vector</option>
        </select>
      </div>

      <ul data-testid="variable-list">
        <li v-for="item in filteredVariables" :key="item.name">
          {{ item.name }} ({{ item.type }}):
          {{ item.type === 'scalar' ? item.scalarValue : item.vectorValue.join(', ') }}
        </li>
      </ul>
    </section>

    <section class="card">
      <h2>Element-wise Operations</h2>
      <div class="row">
        <select v-model="leftVectorName" data-testid="left-vector" aria-label="Left vector">
          <option value="">Select left vector</option>
          <option v-for="item in vectorVariables" :key="`left-${item.name}`" :value="item.name">
            {{ item.name }}
          </option>
        </select>

        <select v-model="operation" data-testid="vector-operation" aria-label="Operation">
          <option value="+">+</option>
          <option value="-">-</option>
          <option value="*">*</option>
          <option value="/">/</option>
        </select>

        <select v-model="rightVectorName" data-testid="right-vector" aria-label="Right vector">
          <option value="">Select right vector</option>
          <option v-for="item in vectorVariables" :key="`right-${item.name}`" :value="item.name">
            {{ item.name }}
          </option>
        </select>
      </div>

      <p v-if="elementWiseResult.error" data-testid="vector-error">{{ elementWiseResult.error }}</p>
      <p v-else data-testid="vector-result">Result: {{ elementWiseResult.result || '—' }}</p>
    </section>

    <section class="card">
      <h2>Saved History</h2>
      <ul data-testid="history-list">
        <li v-for="entry in history" :key="entry.createdAt">
          {{ entry.createdAt }} — expression: {{ entry.expression || '—' }}, variables: {{ entry.variableCount }}
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.dashboard {
  max-width: 960px;
  margin: 0 auto;
  padding: 1rem;
  display: grid;
  gap: 1rem;
}

.card {
  border: 1px solid #d9d9d9;
  border-radius: 0.5rem;
  padding: 1rem;
}

.row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.math-field {
  width: 100%;
  min-height: 2.5rem;
  margin-bottom: 0.5rem;
}

input,
select,
button {
  padding: 0.5rem;
}

ul {
  margin: 0;
  padding-left: 1rem;
}
</style>
