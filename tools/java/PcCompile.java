import java.io.FileWriter;
import java.io.PrintWriter;
import java.io.StringWriter;

/**
 * Runs javac inside CheerpJ and captures its diagnostics to a file.
 *
 * javac's own main() prints errors to stderr, which the page cannot read
 * back reliably. This wrapper calls the compiler API overload that accepts
 * a PrintWriter, then writes the exit code (first line) and the full
 * compiler output (remaining lines) to the path given as args[0], where
 * JavaScript reads it back through cjFileBlob.
 *
 * Rebuild with:
 *   javac --release 8 -cp public/java/tools.jar -d /tmp/pc tools/java/PcCompile.java
 *   jar cf public/java/pc.jar -C /tmp/pc PcCompile.class
 * It must ship as a jar: CheerpJ's HTTP-backed /app/ filesystem cannot use
 * a served directory as a classpath entry.
 */
public final class PcCompile {
  private PcCompile() {}

  public static void main(String[] args) throws Exception {
    String logPath = args[0];
    String[] javacArgs = new String[args.length - 1];
    System.arraycopy(args, 1, javacArgs, 0, javacArgs.length);

    StringWriter diagnostics = new StringWriter();
    PrintWriter collector = new PrintWriter(diagnostics);
    int exitCode;
    try {
      exitCode = com.sun.tools.javac.Main.compile(javacArgs, collector);
    } catch (Throwable error) {
      collector.println("The compiler crashed before finishing: " + error);
      exitCode = -1;
    }
    collector.flush();

    PrintWriter log = new PrintWriter(new FileWriter(logPath));
    try {
      log.println(exitCode);
      log.print(diagnostics.toString());
    } finally {
      log.close();
    }
  }
}
