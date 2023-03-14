## Profiling

Benchpress is executing `console.profile()` and `console.profileEnd()` around the iterations. The profile starts after the warmup, but includes everything within the test (i.e. if you do anything slow before `clock.start()` or after `clock.stop()` it will be included in the profile).

One way to get a CPU profile for Node is to run the test in the JavaScript Debug Terminal in VS Code, which will generate a `.cpuprofile` file, which you can open in VS Code.
