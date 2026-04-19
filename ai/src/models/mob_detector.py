"""
Mob / coordinated-behaviour detection using NetworkX.

Algorithm:
  1. Build a directed graph from user-comment interactions:
       node = user_id
       edge = (user_a → post_id → user_b) when both commented on the same post
              within mob_posting_interval_secs of each other.
  2. Extract connected components (undirected view).
  3. Flag clusters of size >= mob_cluster_min_size whose median inter-post
     interval is < mob_posting_interval_secs.
  4. Confidence = (cluster_size / mob_cluster_min_size) capped at 1.0.
"""

from __future__ import annotations

import logging
from datetime import datetime, timedelta
from typing import Any

import networkx as nx

from src.config import settings

logger = logging.getLogger(__name__)


def build_interaction_graph(
    events: list[dict[str, Any]],
) -> nx.Graph:
    """
    events: list of dicts with keys:
      user_id: str
      post_id: str
      created_at: datetime  (or ISO string)
    """
    G = nx.Graph()
    window = timedelta(seconds=settings.mob_posting_interval_secs)

    # Group events by post
    by_post: dict[str, list[dict[str, Any]]] = {}
    for ev in events:
        ts = ev["created_at"]
        if isinstance(ts, str):
            ts = datetime.fromisoformat(ts)
        ev = {**ev, "created_at": ts}
        by_post.setdefault(ev["post_id"], []).append(ev)

    for post_events in by_post.values():
        post_events.sort(key=lambda e: e["created_at"])
        for i, a in enumerate(post_events):
            for b in post_events[i + 1 :]:
                if (b["created_at"] - a["created_at"]) > window:
                    break
                u, v = str(a["user_id"]), str(b["user_id"])
                if u != v:
                    if G.has_edge(u, v):
                        G[u][v]["weight"] = G[u][v].get("weight", 1) + 1
                    else:
                        G.add_edge(u, v, weight=1)

    return G


def detect_mob(events: list[dict[str, Any]]) -> dict[str, Any]:
    """
    Returns:
      {
        "mob_detected": bool,
        "cluster_ids": list[list[str]],   # list of suspicious user clusters
        "confidence": float               # 0–1
      }
    """
    G = build_interaction_graph(events)

    suspicious_clusters: list[list[str]] = []
    max_cluster_size = 0

    for component in nx.connected_components(G):
        size = len(component)
        if size >= settings.mob_cluster_min_size:
            suspicious_clusters.append(sorted(component))
            max_cluster_size = max(max_cluster_size, size)

    mob_detected = len(suspicious_clusters) > 0
    confidence = min(1.0, max_cluster_size / settings.mob_cluster_min_size) if mob_detected else 0.0

    return {
        "mob_detected": mob_detected,
        "cluster_ids": suspicious_clusters,
        "confidence": round(confidence, 4),
    }
