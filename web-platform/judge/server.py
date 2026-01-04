#!/usr/bin/env python3
"""
Judge HTTP Server - 持久运行的判题服务
通过 HTTP API 接收判题请求，避免每次创建新容器
"""

from flask import Flask, request, jsonify
import os
import json
import traceback
from run_job import judge_submission

app = Flask(__name__)

WORKSPACE_BASE = "/workspace"
RESOURCE_DIR = "/resources"

@app.route("/health", methods=["GET"])
def health():
    """健康检查接口"""
    return jsonify({"status": "ok", "message": "Judge service is running"})

@app.route("/judge", methods=["POST"])
def judge():
    """
    判题接口
    请求体:
    {
        "problem_id": "02_code1",
        "submission_id": "1234567890"
    }
    submission_id 用于定位 /workspace/<submission_id>/ 目录
    """
    try:
        data = request.get_json()
        if not data:
            return jsonify({"status": "error", "message": "No JSON data"}), 400
        
        problem_id = data.get("problem_id")
        submission_id = data.get("submission_id")
        
        if not problem_id or not submission_id:
            return jsonify({
                "status": "error", 
                "message": "Missing problem_id or submission_id"
            }), 400
        
        work_dir = os.path.join(WORKSPACE_BASE, str(submission_id))
        
        if not os.path.isdir(work_dir):
            return jsonify({
                "status": "error",
                "message": f"Submission directory not found: {submission_id}"
            }), 404
        
        print(f"[Judge] Processing: problem={problem_id}, submission={submission_id}")
        
        # 调用判题逻辑
        result = judge_submission(problem_id, work_dir, RESOURCE_DIR)
        
        print(f"[Judge] Result: {result['status']}")
        
        return jsonify(result)
        
    except Exception as e:
        traceback.print_exc()
        return jsonify({
            "status": "system_error",
            "score": 0,
            "logs": ["Judge server error", str(e)]
        }), 500

if __name__ == "__main__":
    print("[Judge Server] Starting on port 9090...")
    # 使用多线程模式以支持并发请求
    app.run(host="0.0.0.0", port=9090, debug=False, threaded=True)

