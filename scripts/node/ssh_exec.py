import argparse
import json
import os
import sys
from pathlib import Path

import paramiko


def main() -> int:
    parser = argparse.ArgumentParser(description="Execute a remote command over SSH using a local JSON config.")
    parser.add_argument("--config", required=True, help="Path to the SSH config JSON file.")
    parser.add_argument("--command", required=True, help="Remote shell command to execute.")
    parser.add_argument("--input-file", help="Optional local file whose contents are piped to stdin.")
    args = parser.parse_args()

    config_path = Path(args.config).resolve()

    if not config_path.exists():
      print(f"SSH config not found: {config_path}", file=sys.stderr)
      return 1

    with config_path.open("r", encoding="utf-8") as fp:
      config = json.load(fp)

    host = config.get("host")
    user = config.get("user")
    port = int(config.get("port", 22))
    password = config.get("password")
    private_key = config.get("privateKey")
    private_key_path = config.get("privateKeyPath")
    known_hosts = config.get("knownHosts")
    timeout = int(config.get("timeoutSeconds", 15))

    if not host or not user:
      print("SSH config must contain host and user", file=sys.stderr)
      return 1

    client = paramiko.SSHClient()
    client.load_system_host_keys()

    if known_hosts:
      known_hosts_path = Path(known_hosts).expanduser().resolve()
      if known_hosts_path.exists():
        client.load_host_keys(str(known_hosts_path))

    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    connect_kwargs: dict[str, object] = {
      "hostname": host,
      "port": port,
      "username": user,
      "timeout": timeout,
      "allow_agent": True,
      "look_for_keys": True,
    }

    if password:
      connect_kwargs["password"] = password

    if private_key:
      connect_kwargs["pkey"] = load_private_key(private_key)
      connect_kwargs["allow_agent"] = False
      connect_kwargs["look_for_keys"] = False
    elif private_key_path:
      key_path = Path(private_key_path).expanduser().resolve()
      connect_kwargs["key_filename"] = str(key_path)

    try:
      client.connect(**connect_kwargs)

      stdin, stdout, stderr = client.exec_command(args.command)

      if args.input_file:
        input_path = Path(args.input_file).resolve()
        with input_path.open("r", encoding="utf-8") as fp:
          stdin.write(fp.read())

      stdin.flush()
      stdin.channel.shutdown_write()

      exit_status = stdout.channel.recv_exit_status()
      sys.stdout.write(stdout.read().decode("utf-8", errors="replace"))
      sys.stderr.write(stderr.read().decode("utf-8", errors="replace"))
      return exit_status
    except Exception as exc:
      print(f"SSH command failed: {exc}", file=sys.stderr)
      return 1
    finally:
      client.close()


def load_private_key(private_key: str):
    normalized = private_key.replace("\\n", "\n")
    key_types = (
      paramiko.Ed25519Key,
      paramiko.RSAKey,
      paramiko.ECDSAKey,
      paramiko.DSSKey,
    )

    for key_type in key_types:
      try:
        return key_type.from_private_key(io.StringIO(normalized))
      except Exception:
        continue

    raise ValueError("Unsupported private key format")


if __name__ == "__main__":
    import io

    raise SystemExit(main())
