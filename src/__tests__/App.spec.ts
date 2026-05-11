import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'

import App from '../App.vue'

describe('App', () => {
  it('adds and displays a scalar variable', async () => {
    const wrapper = mount(App)

    await wrapper.get('[data-testid="variable-name"]').setValue('taxRate')
    await wrapper.get('[data-testid="variable-value"]').setValue('5')
    await wrapper.get('[data-testid="add-variable"]').trigger('click')

    expect(wrapper.get('[data-testid="variable-list"]').text()).toContain('taxRate (scalar): 5')
  })

  it('filters variables by type', async () => {
    const wrapper = mount(App)

    await wrapper.get('[data-testid="variable-name"]').setValue('s')
    await wrapper.get('[data-testid="variable-value"]').setValue('7')
    await wrapper.get('[data-testid="add-variable"]').trigger('click')

    await wrapper.get('[data-testid="variable-name"]').setValue('v')
    await wrapper.get('[data-testid="variable-value"]').setValue('1,2,3')
    await wrapper.get('[data-testid="add-variable"]').trigger('click')

    await wrapper.get('[data-testid="filter-type"]').setValue('vector')

    const listText = wrapper.get('[data-testid="variable-list"]').text()
    expect(listText).toContain('v (vector): 1, 2, 3')
    expect(listText).not.toContain('s (scalar): 7')
  })

  it('computes element-wise vector addition', async () => {
    const wrapper = mount(App)

    await wrapper.get('[data-testid="variable-name"]').setValue('a')
    await wrapper.get('[data-testid="variable-value"]').setValue('1,2,3')
    await wrapper.get('[data-testid="add-variable"]').trigger('click')

    await wrapper.get('[data-testid="variable-name"]').setValue('b')
    await wrapper.get('[data-testid="variable-value"]').setValue('4,5,6')
    await wrapper.get('[data-testid="add-variable"]').trigger('click')

    await wrapper.get('[data-testid="left-vector"]').setValue('a')
    await wrapper.get('[data-testid="vector-operation"]').setValue('+')
    await wrapper.get('[data-testid="right-vector"]').setValue('b')

    expect(wrapper.get('[data-testid="vector-result"]').text()).toContain('Result: 5, 7, 9')
  })
})
