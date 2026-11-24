<?php
/**
 * Notation Bible → Readers: the site's reader accounts (separate from WordPress users).
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

class NB_Readers_Admin {

	const PAGE     = 'notation-bible-readers';
	const PER_PAGE = 50;

	public static function init() {
		add_action( 'admin_menu', array( __CLASS__, 'menu' ), 11 );
		add_action( 'admin_post_nb_reader', array( __CLASS__, 'handle' ) );
	}

	public static function menu() {
		add_submenu_page( 'notation-bible', 'Readers', 'Readers', 'manage_options', self::PAGE, array( __CLASS__, 'page' ) );
	}

	private static function url( $args = array() ) {
		return add_query_arg( $args, admin_url( 'admin.php?page=' . self::PAGE ) );
	}

	private static function action_url( $do, $id ) {
		return wp_nonce_url( admin_url( 'admin-post.php?action=nb_reader&do=' . $do . '&id=' . (int) $id ), 'nb_reader_' . $do . '_' . (int) $id );
	}

	/** Add, disable, enable, delete, send reset. */
	public static function handle() {
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You are not allowed to manage readers.', 'notation-bible' ) );
		}
		$do   = sanitize_key( wp_unslash( $_REQUEST['do'] ?? '' ) );
		$id   = (int) ( $_REQUEST['id'] ?? 0 );
		$msg  = '';
		$link = '';
		check_admin_referer( 'nb_reader_' . $do . '_' . $id );

		if ( 'add' === $do ) {
			$name     = sanitize_text_field( wp_unslash( $_POST['name'] ?? '' ) );
			$username = sanitize_text_field( wp_unslash( $_POST['username'] ?? '' ) );
			$new      = NB_Accounts::create( $name, $username );
			if ( is_wp_error( $new ) ) {
				$msg = 'error:' . $new->get_error_message();
			} else {
				$link = NB_Accounts::make_link( $new );
				$msg  = sprintf( 'Added %s. Copy this link and send it to them so they can choose a password:', NB_Accounts::clean_username( $username ) );
			}
		} elseif ( $id && NB_Accounts::get( $id ) ) {
			$r    = NB_Accounts::get( $id );
			$user = $r['username'];
			switch ( $do ) {
				case 'disable':
					NB_Accounts::set_status( $id, 'disabled' );
					$msg = sprintf( '%s can no longer sign in. Their notes are kept.', $user );
					break;
				case 'enable':
					NB_Accounts::set_status( $id, 'active' );
					$msg = sprintf( '%s can sign in again.', $user );
					break;
				case 'reset':
					$link = NB_Accounts::make_link( $id );
					$msg  = sprintf( 'Copy this link and send it to %s so they can choose a new password:', $user );
					break;
				case 'signout':
					NB_Accounts::end_sessions( $id );
					$msg = sprintf( '%s was signed out on every device.', $user );
					break;
				case 'delete':
					NB_Accounts::delete( $id );
					$msg = sprintf( 'Deleted %s and their notes.', $user );
					break;
			}
		}
		set_transient( 'nb_readers_msg_' . get_current_user_id(), array( 'msg' => $msg, 'link' => $link ), 10 * MINUTE_IN_SECONDS );
		wp_safe_redirect( self::url() );
		exit;
	}

	/** Highlights, notes and NoteTrees in a reader's saved data. */
	private static function counts( $json ) {
		$d = json_decode( (string) $json, true );
		if ( ! is_array( $d ) ) {
			return array( 0, 0, 0 );
		}
		$hl = array();
		$nt = array();
		foreach ( (array) ( $d['ann'] ?? array() ) as $a ) {
			if ( ! is_array( $a ) || empty( $a['g'] ) ) {
				continue;
			}
			if ( 'note' === ( $a['k'] ?? '' ) ) {
				$nt[ $a['g'] ] = 1;
			} else {
				$hl[ $a['g'] ] = 1;
			}
		}
		return array( count( $hl ), count( $nt ), count( (array) ( $d['trees'] ?? array() ) ) );
	}

	public static function page() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}
		global $wpdb;
		$rt     = NB_Accounts::table( 'readers' );
		$dt     = NB_Accounts::table( 'reader_data' );
		$q      = isset( $_GET['s'] ) ? sanitize_text_field( wp_unslash( $_GET['s'] ) ) : ''; // phpcs:ignore WordPress.Security.NonceVerification
		$paged  = max( 1, (int) ( $_GET['paged'] ?? 1 ) ); // phpcs:ignore WordPress.Security.NonceVerification
		$where  = '';
		$params = array();
		if ( '' !== $q ) {
			$like   = '%' . $wpdb->esc_like( $q ) . '%';
			$where  = 'WHERE r.username LIKE %s OR r.name LIKE %s';
			$params = array( $like, $like );
		}
		$total_sql = "SELECT COUNT(*) FROM $rt r $where";
		$total     = (int) ( $params ? $wpdb->get_var( $wpdb->prepare( $total_sql, $params ) ) : $wpdb->get_var( $total_sql ) ); // phpcs:ignore WordPress.DB.PreparedSQL
		$list_sql  = "SELECT r.*, d.data, d.updated FROM $rt r LEFT JOIN $dt d ON d.reader_id = r.id $where ORDER BY r.created DESC LIMIT %d OFFSET %d";
		$rows      = $wpdb->get_results( $wpdb->prepare( $list_sql, array_merge( $params, array( self::PER_PAGE, ( $paged - 1 ) * self::PER_PAGE ) ) ), ARRAY_A ); // phpcs:ignore WordPress.DB.PreparedSQL
		$note      = get_transient( 'nb_readers_msg_' . get_current_user_id() );
		$msg       = is_array( $note ) ? $note['msg'] : '';
		$link      = is_array( $note ) ? $note['link'] : '';
		delete_transient( 'nb_readers_msg_' . get_current_user_id() );
		$off  = ! NB_Accounts::enabled();
		$date = function ( $gmt ) {
			return $gmt ? esc_html( wp_date( get_option( 'date_format' ), strtotime( $gmt . ' UTC' ) ) ) : '—';
		};
		?>
		<div class="wrap">
			<h1 class="wp-heading-inline">Readers</h1>
			<hr class="wp-header-end">
			<?php if ( $msg ) : ?>
				<?php $err = 0 === strpos( $msg, 'error:' ); ?>
				<div class="notice notice-<?php echo $err ? 'error' : 'success'; ?>"><p><?php echo esc_html( $err ? substr( $msg, 6 ) : $msg ); ?></p>
				<?php if ( $link ) : ?>
					<p style="display:flex;gap:8px;max-width:820px"><input id="nb-link" type="text" readonly class="large-text code" value="<?php echo esc_attr( $link ); ?>" onclick="this.select()">
					<button type="button" class="button button-primary" id="nb-copy" onclick="var i=document.getElementById('nb-link');i.select();(navigator.clipboard?navigator.clipboard.writeText(i.value):Promise.reject()).catch(function(){document.execCommand('copy')});this.textContent='Copied'">Copy link</button></p>
					<p class="description">The link works once, for <?php echo (int) NB_Accounts::LINK_DAYS; ?> days. It is only shown now; if it gets lost, make a new one with “Make password link”.</p>
				<?php endif; ?>
				</div>
			<?php endif; ?>
			<?php if ( $off ) : ?>
				<div class="notice notice-warning"><p>Reader accounts are switched off, so nobody can sign in. Turn them on in <a href="<?php echo esc_url( admin_url( 'admin.php?page=notation-bible' ) ); ?>">Settings</a>.</p></div>
			<?php endif; ?>
			<p>Readers sign in from the Bible's menu with a username and password to keep their highlights, notes and NoteTrees on every device. These accounts are separate from WordPress users and can't sign in to WordPress. No email is used: to set up or reset a password, make a password link here and send it to the reader yourself.</p>

			<form method="post" action="<?php echo esc_url( admin_url( 'admin-post.php' ) ); ?>" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:16px 0">
				<input type="hidden" name="action" value="nb_reader"><input type="hidden" name="do" value="add"><input type="hidden" name="id" value="0">
				<?php wp_nonce_field( 'nb_reader_add_0' ); ?>
				<strong>Add a reader:</strong>
				<input name="username" type="text" placeholder="Username" required pattern="[A-Za-z0-9._\-]{3,40}" title="3 to 40 letters or numbers; dots, dashes and underscores are fine" class="regular-text" style="width:14em" autocapitalize="none">
				<input name="name" type="text" placeholder="Name (optional)" class="regular-text" style="width:14em">
				<button class="button button-primary">Add and make a password link</button>
			</form>

			<form method="get" style="float:right;margin-bottom:8px">
				<input type="hidden" name="page" value="<?php echo esc_attr( self::PAGE ); ?>">
				<input type="search" name="s" value="<?php echo esc_attr( $q ); ?>" placeholder="Name or username">
				<button class="button">Search readers</button>
			</form>
			<p class="subsubsub" style="margin-top:6px"><?php echo esc_html( sprintf( _n( '%d reader', '%d readers', $total, 'notation-bible' ), $total ) ); ?></p>

			<table class="wp-list-table widefat fixed striped">
				<thead><tr><th style="width:24%">Reader</th><th>Joined</th><th>Last sign-in</th><th>Last synced</th><th>Highlights</th><th>Notes</th><th>NoteTrees</th><th>Status</th></tr></thead>
				<tbody>
				<?php if ( ! $rows ) : ?>
					<tr><td colspan="8"><?php echo '' !== $q ? 'No readers match.' : 'No readers yet. They appear here when someone creates an account in the Bible, or when you add one.'; ?></td></tr>
				<?php endif; ?>
				<?php
				foreach ( $rows as $r ) :
					list( $hl, $nt, $tr ) = self::counts( $r['data'] );
					$active               = 'active' === $r['status'];
					$id                   = (int) $r['id'];
					?>
					<tr>
						<td><strong><?php echo esc_html( $r['name'] ); ?></strong><br>@<?php echo esc_html( $r['username'] ); ?>
							<div class="row-actions">
								<span><a href="<?php echo esc_url( self::action_url( 'reset', $id ) ); ?>">Make password link</a> | </span>
								<span><a href="<?php echo esc_url( self::action_url( 'signout', $id ) ); ?>">Sign out everywhere</a> | </span>
								<span><a href="<?php echo esc_url( self::action_url( $active ? 'disable' : 'enable', $id ) ); ?>"><?php echo $active ? 'Disable' : 'Enable'; ?></a> | </span>
								<span class="trash"><a href="<?php echo esc_url( self::action_url( 'delete', $id ) ); ?>" onclick="return confirm('Delete this reader and all their highlights and notes? This cannot be undone.')">Delete</a></span>
							</div>
						</td>
						<td><?php echo $date( $r['created'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
						<td><?php echo $date( $r['last_login'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
						<td><?php echo $date( $r['updated'] ); // phpcs:ignore WordPress.Security.EscapeOutput ?></td>
						<td><?php echo (int) $hl; ?></td>
						<td><?php echo (int) $nt; ?></td>
						<td><?php echo (int) $tr; ?></td>
						<td>
							<?php
							echo $active ? ( '' === $r['pass'] ? 'Waiting for password' : 'Active' ) : '<span style="color:#b32d2e">Disabled</span>';
							if ( $active && (int) $r['reset_exp'] > time() ) {
								echo '<br><span class="description">Link works until ' . esc_html( wp_date( get_option( 'date_format' ), (int) $r['reset_exp'] ) ) . '</span>';
							}
							?>
						</td>
					</tr>
				<?php endforeach; ?>
				</tbody>
			</table>
			<?php
			$pages = (int) ceil( $total / self::PER_PAGE );
			if ( $pages > 1 ) {
				echo '<div class="tablenav"><div class="tablenav-pages">' . wp_kses_post(
					paginate_links(
						array(
							'base'    => add_query_arg( 'paged', '%#%' ),
							'format'  => '',
							'current' => $paged,
							'total'   => $pages,
						)
					)
				) . '</div></div>';
			}
			?>
		</div>
		<?php
	}
}
