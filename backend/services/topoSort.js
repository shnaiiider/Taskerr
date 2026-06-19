// Kahn's BFS Topological Sort
// Given tasks with dependency lists (adjacency list), returns execution order
// Returns { order: [taskIds], hasCycle: boolean }

export const topoSort = (tasks) => {
    const graph = {}   // node -> [nodes that depend on it]
    const inDegree = {}

    // init
    tasks.forEach(t => {
        const id = t._id.toString()
        graph[id] = graph[id] || []
        inDegree[id] = inDegree[id] || 0
        ;(t.dependencies || []).forEach(dep => {
            const depId = dep.toString()
            graph[depId] = graph[depId] || []
            graph[depId].push(id)
            inDegree[id] = (inDegree[id] || 0) + 1
            inDegree[depId] = inDegree[depId] || 0
        })
    })

    // BFS from nodes with no incoming edges
    const queue = Object.keys(inDegree).filter(id => inDegree[id] === 0)
    const order = []

    while (queue.length) {
        const node = queue.shift()
        order.push(node)
        ;(graph[node] || []).forEach(neighbor => {
            inDegree[neighbor]--
            if (inDegree[neighbor] === 0) queue.push(neighbor)
        })
    }

    return {
        order,
        hasCycle: order.length !== Object.keys(inDegree).length
    }
}

// Check if adding newDepId as dependency of taskId creates a cycle
export const wouldCreateCycle = (tasks, taskId, newDepId) => {
    const simulated = tasks.map(t =>
        t._id.toString() === taskId
            ? { _id: t._id, dependencies: [...(t.dependencies || []), { toString: () => newDepId }] }
            : t
    )
    return topoSort(simulated).hasCycle
}

// Get tasks blocked by incomplete dependencies
export const getBlockedTasks = (tasks) => {
    const completedIds = new Set(
        tasks.filter(t => t.status === 'completed').map(t => t._id.toString())
    )
    return tasks.filter(t =>
        t.status !== 'completed' &&
        (t.dependencies || []).some(dep => !completedIds.has(dep.toString()))
    )
}
