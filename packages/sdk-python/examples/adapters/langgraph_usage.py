"""LangGraph-style MemoryMesh adapter example.

This file does not require LangGraph to be installed. In a real LangGraph app,
wrap your graph node functions with MemoryMeshLangGraphAdapter.wrap_node().
"""

from memorymesh import MemoryMeshClient, MemoryMeshLangGraphAdapter

client = MemoryMeshClient(base_url="http://localhost:8000")
run = client.start_run(agent_id="langgraph-example", task="Investigate claim documents")
task_id = run.get("task_id") or run.get("taskId")

adapter = MemoryMeshLangGraphAdapter(client, task_id, graph_name="claims-graph")


def retrieve_node(state: dict) -> dict:
    return {**state, "documents": [{"id": "doc_1", "title": "Evidence"}]}


wrapped_retrieve = adapter.wrap_node("retrieve", retrieve_node)
wrapped_retrieve({"query": "missing evidence"})
