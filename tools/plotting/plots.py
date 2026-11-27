from pathlib import Path
import sys

import numpy as np
import matplotlib.pyplot as plt

ROOT = Path(__file__).resolve().parents[2]
RESULTS = ROOT / "results"

if len(sys.argv) > 1:
    CSV = Path(sys.argv[1])
else:
    files = sorted(RESULTS.glob("*.csv"))

    if not files:
        sys.exit("No CSV files found under results/")

    print("Available result files:\n")

    for i, file in enumerate(files, start=1):
        print(f"{i}. {file.name}")

    while True:
        try:
            choice = int(input("\nSelect file number: "))

            if 1 <= choice <= len(files):
                CSV = files[choice - 1]
                break

        except ValueError:
            pass

        print("Invalid selection.")

print(f"\nLoading: {CSV.name}")

data = np.genfromtxt(CSV, delimiter=",", names=True)

print("CSV fields:", data.dtype.names)

t = data["t"]
x = data["x"]
theta = data["theta"]
v = data["v"]
omega = data["omega"]
F = data["F"]
E = data["E"]
px = data["px"]

# backward compatibility with older result files
has_commanded_force = "F_cmd" in data.dtype.names
F_cmd = data["F_cmd"] if has_commanded_force else F

saturated = F_cmd != F

peak_cmd = np.max(np.abs(F_cmd))
peak_applied = np.max(np.abs(F))
saturation_pct = 100 * np.mean(saturated)

dE = E - E[0]
dpx = px - px[0]

# numerical diagnostics
print("\n=== Pendulab simulation ===")
print(f"Samples:          {len(t)}")
print(f"Duration:         {t[-1] - t[0]:.6f} s")
print(f"Mean timestep:    {np.mean(np.diff(t)):.6e} s")
print(f"Initial energy:   {E[0]:.10e} J")
print(f"Initial momentum: {px[0]:.10e} kg m/s")

print("\n=== Actuator diagnostics ===")
print(f"Peak applied force:   {peak_applied:.6f} N")

if has_commanded_force:
    print(f"Peak commanded force: {peak_cmd:.6f} N")
    print(f"Saturated samples:    {np.count_nonzero(saturated)}")
    print(f"Saturation ratio:     {saturation_pct:.2f}%")
    print(f"Peak rejected force:  {np.max(np.abs(F_cmd - F)):.6f} N")

if np.all(F == 0):
    print("\n=== Conservation diagnostics ===")
    print(f"Max energy error:   {np.max(np.abs(dE)):.10e} J")
    print(f"Max momentum error: {np.max(np.abs(dpx)):.10e} kg m/s")

    if E[0] != 0:
        print(f"Relative E error:   {np.max(np.abs(dE)) / abs(E[0]):.10e}")
else:
    print(
        "\nForced system: energy and momentum changes "
        "are not necessarily numerical errors."
    )

# visualization
fig, axes = plt.subplots(3, 3, figsize=(16, 10), sharex=True)
fig.suptitle("Pendulab — Single Pendulum Dynamics")

plots = [
    (x, "Cart position", "x [m]"),
    (theta, "Pendulum angle", "θ [rad]"),
    (None, "Actuator force", "F [N]"),
    (v, "Cart velocity", "v [m/s]"),
    (omega, "Angular velocity", "ω [rad/s]"),
    (E, "Mechanical energy", "E [J]"),
    (px, "Horizontal momentum", "pₓ [kg m/s]"),
    (dE, "Energy change", "ΔE [J]"),
    (dpx, "Momentum change", "Δpₓ [kg m/s]"),
]

for ax, (values, title, ylabel) in zip(axes.flat, plots):
    if values is not None:
        ax.plot(t, values, linewidth=1)

    ax.set_title(title)
    ax.set_ylabel(ylabel)
    ax.grid(alpha=0.25)

# dedicated actuator plot
ax = axes[0, 2]

if has_commanded_force:
    ax.plot(
        t,
        F_cmd,
        linestyle="--",
        linewidth=1.2,
        color="tab:orange",
        label=f"Commanded (peak {peak_cmd:.2f} N)",
    )

    ax.fill_between(
        t,
        F_cmd,
        F,
        where=saturated,
        color="tab:red",
        alpha=0.18,
        label=f"Saturation ({saturation_pct:.2f}%)",
    )

ax.plot(
    t, F, color="tab:blue", linewidth=1.5, label=f"Applied (peak {peak_applied:.2f} N)"
)

ax.axhline(0, color="gray", linewidth=0.6)
ax.legend(loc="best", fontsize=8)

for ax in axes[-1]:
    ax.set_xlabel("Time [s]")

for ax in (axes[2, 1], axes[2, 2]):
    ax.ticklabel_format(axis="y", style="sci", scilimits=(0, 0))

fig.tight_layout()
plt.show()
